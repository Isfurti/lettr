import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { getProSubscription } from "@/lib/db";
import { fetchSubscription, verifySubscriptionSignature } from "@/lib/razorpay";
import { fulfilSubscriptionCharge } from "@/lib/pro-payments";

/**
 * Called by the browser right after the first payment on a renewing plan. The
 * signature proves Razorpay took it, so Pro switches on at once instead of
 * waiting for the webhook.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => ({}));
  const subscriptionId = typeof body?.razorpay_subscription_id === "string" ? body.razorpay_subscription_id : "";
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";

  const sub = subscriptionId ? await getProSubscription(subscriptionId) : undefined;
  if (!sub || sub.user_id !== userId) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  if (!verifySubscriptionSignature({ subscriptionId, paymentId, signature })) {
    Sentry.captureMessage("Razorpay subscription signature did not match", { level: "warning", extra: { subscriptionId, paymentId } });
    return NextResponse.json({ error: "We couldn't confirm this payment. If money was taken, contact support." }, { status: 400 });
  }

  try {
    // The exact end of the paid month, if Razorpay has it yet; otherwise a month from now.
    const live = await fetchSubscription(subscriptionId).catch(() => null);
    await fulfilSubscriptionCharge({
      subscriptionId,
      paymentId,
      amount: sub.amount,
      currency: sub.currency,
      currentEnd: live?.current_end ?? null,
      plan: sub.plan_id,
    });
  } catch (err) {
    Sentry.captureException(err, { extra: { subscriptionId, paymentId } });
    return NextResponse.json(
      { error: "Your payment went through, but Pro didn't switch on yet. It will within a few minutes, or contact support." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
