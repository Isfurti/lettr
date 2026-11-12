import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { expireLapsedPro, listProEndingSoon, listSubscriptionsRenewingSoon, markProReminderSent, markSubscriptionReminderSent } from "@/lib/db";
import { sendProEndingSoonEmail, sendRenewalReminderEmail } from "@/lib/email";
import { formatProDate, isPlanId, PRO_REMINDER_DAYS, RENEWAL_PERIOD, RENEWAL_REMINDER_DAYS } from "@/lib/pro-pass";
import { formatMinor } from "@/lib/pro-payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Daily job (vercel.json): moves people whose Pro pass ran out back to Free,
 * emails anyone whose Pro ends in the next few days, and emails anyone whose
 * auto-renewing Pro renews in the next few days.
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
    return NextResponse.json({ ok: false, error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
