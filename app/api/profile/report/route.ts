import { NextResponse } from "next/server";
import { z } from "zod";
import { createProfileReport, getPublicProfileBySlug, REPORT_REASONS } from "@/lib/db";
import { anonymousClientKey } from "@/lib/client-key";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { isJsonRequest, isSameOriginRequest } from "@/lib/same-origin";
import { notifyAdminOfSupportMessage } from "@/lib/notify";

export const runtime = "nodejs";

const Body = z.object({
  slug: z.string().min(16).max(64),
  reason: z.enum(REPORT_REASONS),
  details: z.string().max(1000).optional(),
  email: z.string().email().max(200).optional().or(z.literal("")),
});

const REASON_TEXT: Record<(typeof REPORT_REASONS)[number], string> = {
  not_me: "This is about me and I did not make it",
  private_info: "Shows private information",
  harassment: "Harassment or abuse",
  spam: "Spam or a scam",
  other: "Something else",
};

/**
 * Anyone with a profile link can report it, signed in or not. The answer is the
 * same whether or not the link is live, so this cannot be used to test links.
 */
export async function POST(req: Request) {
  if (!isSameOriginRequest(req) || !isJsonRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const rate = await checkAndRecordRateLimit(anonymousClientKey(req.headers), "profile-report", 5, 60);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "You've sent a few reports already. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Choose a reason." }, { status: 400 });

  const src = await getPublicProfileBySlug(parsed.data.slug);
  if (src) {
    const { reason, details, email } = parsed.data;
    await createProfileReport({ userId: src.user_id, reason, details, reporterEmail: email || undefined });
    // Best effort: the report is already saved if email is not set up.
    await notifyAdminOfSupportMessage({
      fromEmail: email || "no-reply@getlettr.com",
      subject: `Profile report: ${REASON_TEXT[reason]}`,
      message: `${details ?? "(no details)"}\n\nReview it in Admin > Profile reports.`,
    }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
