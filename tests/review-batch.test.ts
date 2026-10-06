import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { randomUUID } from "node:crypto";
import pool, { createUser, createReview, listReviewsForUser } from "@/lib/db";
import { runReviewBatchJob, reviewAnalysisMode } from "@/lib/review-batch";

afterAll(async () => {
  await pool.end();
});

beforeAll(async () => {
  // Start from a clean queue so other tests' reviews don't get mixed in.
  await pool.query("UPDATE reviews SET analysis_status = 'done' WHERE analysis_status <> 'done'");
});

function fakeClient(results: Record<string, "succeeded" | "expired">) {
  const created: { custom_id: string; params: { model: string } }[][] = [];
  let status = "in_progress";
  const client = {
    messages: {
      create: async () => {
        throw new Error("should not be called");
      },
      batches: {
        create: async (p: { requests: { custom_id: string; params: { model: string } }[] }) => {
          created.push(p.requests);
          return { id: `msgbatch_${created.length}` };
        },
        retrieve: async () => ({ processing_status: status }),
        results: async () =>
          (async function* () {
            for (const req of created[0]) {
              const kind = results[req.custom_id];
              if (kind === "succeeded") {
                yield {
                  custom_id: req.custom_id,
                  result: {
                    type: "succeeded",
                    message: {
                      content: [
                        { type: "text", text: JSON.stringify({ sentiment: "mixed", likes: ["Templates"], dislikes: ["Price"], reply: "Thanks, noted on price." }) },
                      ],
                      usage: { input_tokens: 400, output_tokens: 80 },
                    },
                  },
                };
              } else {
                yield { custom_id: req.custom_id, result: { type: "expired" } };
              }
            }
          })(),
      },
    },
  };
  return { client, created, finish: () => (status = "ended") };
}

describe("review analysis batch job", () => {
  it("defaults to batch mode, with an instant switch", () => {
    expect(reviewAnalysisMode({})).toBe("batch");
    expect(reviewAnalysisMode({ REVIEW_ANALYSIS: "instant" })).toBe("instant");
  });

  it("sends pending reviews in one batch, then saves results, emails replies and re-queues expired ones", async () => {
    const userId = randomUUID();
    const email = `batch-${userId}@example.com`;
    await createUser({ id: userId, email, passwordHash: "x", name: "Batch" });
    const ok = randomUUID();
    const late = randomUUID();
    await createReview({ id: ok, userId, rating: 4, content: "Great templates but pricey", consentToFeature: false });
    await createReview({ id: late, userId, rating: 2, content: "Import missed my dates", consentToFeature: false });

    const { client, created, finish } = fakeClient({ [ok]: "succeeded", [late]: "expired" });
    const sent: string[] = [];
    const sendReply = async (to: string, reply: string) => {
      sent.push(`${to}|${reply}`);
      return { sent: true };
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deps = { client: client as any, sendReply };

    // 1st run: both go off in one batch, using the cheap model.
    expect(await runReviewBatchJob(deps)).toMatchObject({ submitted: 2, analysed: 0 });
    expect(created[0].map((r) => r.custom_id).sort()).toEqual([ok, late].sort());
    expect(created[0][0].params.model).toContain("haiku");

    // 2nd run while the batch is still processing: nothing changes.
    expect(await runReviewBatchJob(deps)).toMatchObject({ submitted: 0, analysed: 0, waiting: 2 });

    // 3rd run after it ends: one saved and emailed, the expired one sent again.
    finish();
    expect(await runReviewBatchJob(deps)).toMatchObject({ analysed: 1, retried: 1, submitted: 1 });
    expect(sent).toEqual([`${email}|Thanks, noted on price.`]);

    const mine = await listReviewsForUser(userId);
    const saved = mine.find((r) => r.id === ok)!;
    expect(saved).toMatchObject({ analysis_status: "done", sentiment: "mixed", ai_reply: "Thanks, noted on price.", reply_emailed: true });
    expect(saved.dislikes).toEqual(["Price"]);
    const again = mine.find((r) => r.id === late)!;
    expect(again.analysis_status).toBe("submitted");
    expect(again.analysis_batch_id).toBe("msgbatch_2");

    const usage = await pool.query("SELECT batch, input_tokens FROM ai_usage_events WHERE user_id = $1 AND feature = 'review'", [userId]);
    expect(usage.rows).toEqual([{ batch: true, input_tokens: 400 }]);
  });
});
