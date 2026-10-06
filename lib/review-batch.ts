import type Anthropic from "@anthropic-ai/sdk";
import * as Sentry from "@sentry/nextjs";
import { analyzeReview, getAnthropicClient, parseReviewAnalysis, reviewAnalysisRequest, REVIEW_MODEL } from "./ai";
import { usageFromApi } from "./ai-costs";
import { trackAiUsage } from "./ai-usage";
import {
  listReviewsAwaitingAnalysis,
  markReviewsSubmitted,
  saveReviewAnalysis,
  setReviewAnalysisStatus,
} from "./db";
import { sendReviewReplyEmail } from "./email";

/**
 * Review analysis (likes, dislikes and the reply email) through Anthropic's
 * batch API, which costs half the normal price. Nobody is waiting on it: the
 * review is saved straight away and the reply email follows, usually within
 * minutes and at most a day later.
 *
 * Runs from the daily cron job (/api/cron/reviews), whenever an admin opens
 * the Reviews page, and right after a review is submitted (to send it off).
 * Set REVIEW_ANALYSIS=instant to go back to analysing on the spot.
 */
export function reviewAnalysisMode(env: Record<string, string | undefined> = process.env): "batch" | "instant" {
  return env.REVIEW_ANALYSIS?.trim().toLowerCase() === "instant" ? "instant" : "batch";
}

type BatchClient = {
  messages: {
    create: Anthropic["messages"]["create"];
    batches: {
      create: (p: Anthropic.Messages.BatchCreateParams) => Promise<{ id: string }>;
      retrieve: (id: string) => Promise<{ processing_status: string }>;
      results: (id: string) => Promise<AsyncIterable<Anthropic.Messages.MessageBatchIndividualResponse>>;
    };
  };
};

type Deps = {
  client?: BatchClient;
  sendReply?: (email: string, reply: string) => Promise<{ sent: boolean }>;
};

export type ReviewBatchSummary = { submitted: number; analysed: number; retried: number; waiting: number };

/** Sends every pending review off in one batch, and saves the results of any finished batch. */
export async function runReviewBatchJob(deps: Deps = {}): Promise<ReviewBatchSummary> {
  const sendReply = deps.sendReply ?? sendReviewReplyEmail;
  const summary: ReviewBatchSummary = { submitted: 0, analysed: 0, retried: 0, waiting: 0 };

  const waiting = await listReviewsAwaitingAnalysis();
  if (waiting.length === 0) return summary; // nothing to do, no API call
  const client = deps.client ?? (getAnthropicClient() as unknown as BatchClient);
  const byId = new Map(waiting.map((r) => [r.id, r]));

  // 1. Collect finished batches.
  const batchIds = [...new Set(waiting.filter((r) => r.analysis_status === "submitted" && r.analysis_batch_id).map((r) => r.analysis_batch_id as string))];
  for (const batchId of batchIds) {
    const batch = await client.messages.batches.retrieve(batchId);
    if (batch.processing_status !== "ended") {
      summary.waiting += waiting.filter((r) => r.analysis_batch_id === batchId).length;
      continue;
    }
    for await (const item of await client.messages.batches.results(batchId)) {
      const review = byId.get(item.custom_id);
      if (!review) continue;
      if (item.result.type === "succeeded") {
        const msg = item.result.message;
        const text = msg.content.map((b) => (b.type === "text" ? b.text : "")).join("");
        await finish(review, parseReviewAnalysis(text), sendReply);
        await trackAiUsage({ userId: review.user_id, feature: "review", model: REVIEW_MODEL, usage: usageFromApi(msg.usage), batch: true });
        summary.analysed++;
      } else if (item.result.type === "errored") {
        // A request the batch couldn't run: do this one on the spot instead.
        try {
          const { value, usage } = await analyzeReview(review.rating, review.content);
          await finish(review, value, sendReply);
          await trackAiUsage({ userId: review.user_id, feature: "review", model: REVIEW_MODEL, usage });
          summary.analysed++;
        } catch (err) {
          Sentry.captureException(err);
          await setReviewAnalysisStatus(review.id, "failed");
        }
      } else {
        // Expired or cancelled: put it back in the queue for the next batch.
        await setReviewAnalysisStatus(review.id, "pending");
        review.analysis_status = "pending";
        summary.retried++;
      }
    }
  }

  // 2. Send everything still pending in one batch.
  const pending = (await listReviewsAwaitingAnalysis()).filter((r) => r.analysis_status === "pending");
  if (pending.length > 0) {
    const batch = await client.messages.batches.create({
      requests: pending.map((r) => ({ custom_id: r.id, params: reviewAnalysisRequest(r.rating, r.content) })),
    });
    await markReviewsSubmitted(
      pending.map((r) => r.id),
      batch.id
    );
    summary.submitted = pending.length;
  }

  return summary;
}

async function finish(
  review: { id: string; user_email: string | null },
  a: { sentiment: string; likes: string[]; dislikes: string[]; reply: string },
  sendReply: (email: string, reply: string) => Promise<{ sent: boolean }>
) {
  let emailed = false;
  if (review.user_email) {
    try {
      emailed = (await sendReply(review.user_email, a.reply)).sent;
    } catch (err) {
      Sentry.captureException(err);
    }
  }
  await saveReviewAnalysis(review.id, { sentiment: a.sentiment, likes: a.likes, dislikes: a.dislikes, aiReply: a.reply, replyEmailed: emailed });
}
