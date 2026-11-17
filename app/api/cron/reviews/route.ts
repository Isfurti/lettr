import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { runReviewBatchJob } from "@/lib/review-batch";
import { cronAuthorized } from "@/lib/cron-auth";
import { publicMessage } from "@/lib/public-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily job (vercel.json): saves finished review analyses, emails the replies
 * and sends any waiting reviews off in a new half-price batch.
 *
 * Only Vercel's scheduler can call this (it sends CRON_SECRET). If CRON_SECRET is
 * not set, nobody can.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const summary = await runReviewBatchJob();
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: publicMessage(err, "Failed") }, { status: 500 });
  }
}
