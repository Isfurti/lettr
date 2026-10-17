import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { expireLapsedPro, listProEndingSoon, markProReminderSent } from "@/lib/db";
import { sendProEndingSoonEmail } from "@/lib/email";
import { formatProDate, PRO_REMINDER_DAYS } from "@/lib/pro-pass";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily job (vercel.json): moves people whose Pro pass ran out back to Free,
 * and emails anyone whose Pro ends in the next few days.
 *
 * If CRON_SECRET is set in Vercel, only Vercel's scheduler can call this.
 * Without it the route still only does work that's already due.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const expired = await expireLapsedPro();
    let reminded = 0;
    for (const user of await listProEndingSoon(PRO_REMINDER_DAYS)) {
      if (!user.pro_until) continue;
      const { sent } = await sendProEndingSoonEmail({ email: user.email, proUntil: formatProDate(user.pro_until) });
      if (sent) {
        await markProReminderSent(user.id, user.pro_until);
        reminded++;
      }
    }
    return NextResponse.json({ ok: true, expired, reminded });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
