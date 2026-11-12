import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { getActiveSubscriptionForUser, getUserById, markSubscriptionCancelling } from "@/lib/db";
import { cancelSubscriptionAtCycleEnd } from "@/lib/razorpay";
import { sendAutoRenewCancelledEmail } from "@/lib/email";
import { formatProDate } from "@/lib/pro-pass";

/** Stops auto-renew. Pro keeps running until the end of the month already paid for. */
export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const sub = await getActiveSubscriptionForUser(userId);
  if (!sub) return NextResponse.json({ error: "You don't have an auto-renewing plan." }, { status: 404 });
  if (sub.cancel_at_cycle_end) return NextResponse.json({ ok: true });

  try {
    await cancelSubscriptionAtCycleEnd(sub.id);
    await markSubscriptionCancelling(sub.id);
  } catch (err) {
    Sentry.captureException(err, { extra: { subscriptionId: sub.id } });
    return NextResponse.json(
      { error: "We couldn't cancel right now. Please try again, or email support and we'll do it for you." },
      { status: 502 }
    );
  }

  const user = await getUserById(userId);
  if (user?.email && user.pro_until) {
    await sendAutoRenewCancelledEmail({ email: user.email, proUntil: formatProDate(user.pro_until) }).catch((err) =>
      Sentry.captureException(err)
    );
  }
  return NextResponse.json({ ok: true, proUntil: user?.pro_until ? formatProDate(user.pro_until) : null });
}
