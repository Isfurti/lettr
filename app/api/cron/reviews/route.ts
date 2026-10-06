import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { runReviewBatchJob } from "@/lib/review-batch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily job (vercel.json): saves finished review analyses, emails the replies
 * and sends any waiting reviews off in a new half-price batch.
 *
 * If CRON_SECRET is set in Vercel, only Vercel's scheduler can call this.
 * Without it the route still only does work that's already due, so a stray
 * call is harmless.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runReviewBatchJob();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
