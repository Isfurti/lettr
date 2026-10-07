import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { createReview, logActivity } from "@/lib/db";
import { analyzeReview } from "@/lib/ai";
import { sendReviewReplyEmail } from "@/lib/email";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { trackAiUsage } from "@/lib/ai-usage";
import { reviewAnalysisMode, runReviewBatchJob } from "@/lib/review-batch";
import * as Sentry from "@sentry/nextjs";

const Schema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(3000),
  consentToFeature: z.boolean().default(false),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const rateLimit = await checkAndRecordRateLimit(userId, "reviews", 5, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const id = randomUUID();
  const review = {
    id,
    userId,
    rating: parsed.data.rating,
    content: parsed.data.content,
    consentToFeature: parsed.data.consentToFeature,
  };

  // Normally the analysis and reply go through the half-price batch API and
  // the reply arrives by email (lib/review-batch.ts).
  if (reviewAnalysisMode() === "batch") {
    await createReview(review);
    await logActivity(userId, "review_submitted", `${parsed.data.rating}★`);
    try {
      await runReviewBatchJob();
    } catch (err) {
      // Stays queued; the daily job or the admin Reviews page sends it later.
      Sentry.captureException(err);
    }
    return NextResponse.json({ reply: null, queued: true }, { status: 201 });
  }

  let analysis;
  try {
    const result = await analyzeReview(parsed.data.rating, parsed.data.content);
    analysis = result.value;
    await trackAiUsage({ userId, feature: "review", model: result.model, usage: result.usage });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  // Best-effort - the reply is already shown in the UI response either way,
  // so a failed/unconfigured email isn't a broken experience, just a missed
  // extra touchpoint.
  // Replies to 1-2 star reviews wait for a person to approve them.
  const held = parsed.data.rating <= 2;
  const emailed = session.user.email && !held ? (await sendReviewReplyEmail(session.user.email, analysis.reply)).sent : false;

  await createReview({
    ...review,
    sentiment: analysis.sentiment,
    likes: analysis.likes,
    dislikes: analysis.dislikes,
    aiReply: analysis.reply,
    replyEmailed: emailed,
    replyHeld: held,
  });

  await logActivity(userId, "review_submitted", `${parsed.data.rating}★`);

  return NextResponse.json({ reply: held ? null : analysis.reply, queued: held }, { status: 201 });
}
