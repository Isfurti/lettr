import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { expireLapsedPro, listProEndingSoon, listSubscriptionsRenewingSoon, markProReminderSent, markSubscriptionReminderSent } from "@/lib/db";
import { sendProEndingSoonEmail, sendRenewalReminderEmail } from "@/lib/email";
import { formatProDate, isPlanId, PRO_REMINDER_DAYS, RENEWAL_PERIOD, RENEWAL_REMINDER_DAYS } from "@/lib/pro-pass";
import { formatMinor } from "@/lib/pro-payments";
import { cronAuthorized } from "@/lib/cron-auth";
import { publicMessage } from "@/lib/public-error";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily job (vercel.json): moves people whose Pro pass ran out back to Free,
 * emails anyone whose Pro ends in the next few days, and emails anyone whose
 * auto-renewing Pro renews in the next few days.
 *
 * Only Vercel's scheduler can call this (it sends CRON_SECRET). If CRON_SECRET is
 * not set, nobody can.
 */
export async function GET(req: Request) {
  if (!cronAuthorized(req)) {
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
    let renewalReminders = 0;
    for (const sub of await listSubscriptionsRenewingSoon(RENEWAL_REMINDER_DAYS)) {
      if (!sub.current_end) continue;
      const { sent } = await sendRenewalReminderEmail({
        email: sub.email,
        price: formatMinor(sub.amount, sub.currency),
        period: RENEWAL_PERIOD[isPlanId(sub.plan_id) ? sub.plan_id : "monthly"],
        renewsOn: formatProDate(sub.current_end),
      });
      if (sent) {
        await markSubscriptionReminderSent(sub.id, sub.current_end);
        renewalReminders++;
      }
    }
    return NextResponse.json({ ok: true, expired, reminded, renewalReminders });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ ok: false, error: publicMessage(err, "Failed") }, { status: 500 });
  }
}
