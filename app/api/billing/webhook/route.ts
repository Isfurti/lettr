import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { fulfilProPayment, fulfilSubscriptionCharge } from "@/lib/pro-payments";
import { getPaymentRecord, getProSubscription, setSubscriptionStatus } from "@/lib/db";

/**
 * Razorpay webhook (Razorpay dashboard → Webhooks → this URL, events
 * "order.paid", "payment.captured" and, for auto-renew, "subscription.charged",
 * "subscription.activated", "subscription.halted", "subscription.cancelled"
 * and "subscription.completed"). Backs up the checkout: if the buyer closed
 * the tab before the checkout confirmed, Pro still switches on. Renewals only
 * ever arrive here.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: {
    event?: string;
    payload?: {
      payment?: { entity?: { id?: string; order_id?: string; amount?: number; currency?: string } };
      subscription?: { entity?: { id?: string; status?: string; current_end?: number | null } };
    };
  };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (event.event?.startsWith("subscription.")) return handleSubscriptionEvent(event);

  if (event.event !== "order.paid" && event.event !== "payment.captured") {
    // Other events are ignored on purpose.
    return NextResponse.json({ received: true });
  }
  const payment = event.payload?.payment?.entity;
  if (!payment?.id || !payment.order_id) return NextResponse.json({ received: true });
  // Orders made outside Lettr (e.g. a payment link) aren't ours to handle.
  if (!(await getPaymentRecord(payment.order_id))) return NextResponse.json({ received: true });

  try {
    await fulfilProPayment(payment.order_id, payment.id);
  } catch (err) {
    // 500 makes Razorpay retry, so a paid order never gets lost.
    Sentry.captureException(err, { extra: { razorpayEvent: event.event, orderId: payment.order_id } });
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}

const STATUS_FOR_EVENT: Record<string, string> = {
  "subscription.activated": "active",
  "subscription.halted": "halted",
  "subscription.cancelled": "cancelled",
  "subscription.completed": "completed",
};

async function handleSubscriptionEvent(event: {
  event?: string;
  payload?: {
    payment?: { entity?: { id?: string; amount?: number; currency?: string } };
    subscription?: { entity?: { id?: string; status?: string; current_end?: number | null } };
  };
}) {
  const sub = event.payload?.subscription?.entity;
  // Subscriptions made outside Lettr aren't ours to handle.
  const ours = sub?.id ? await getProSubscription(sub.id) : undefined;
  if (!sub?.id || !ours) return NextResponse.json({ received: true });
  try {
    if (event.event === "subscription.charged") {
      const payment = event.payload?.payment?.entity;
      if (payment?.id && payment.amount && payment.currency) {
        await fulfilSubscriptionCharge({
          subscriptionId: sub.id,
          paymentId: payment.id,
          amount: payment.amount,
          currency: payment.currency,
          currentEnd: sub.current_end ?? null,
          plan: ours.plan_id,
        });
      }
    } else if (event.event && STATUS_FOR_EVENT[event.event]) {
      // Halted or cancelled just stops future charges: Pro runs out on its own
      // at the end of the paid period (plus grace) through the daily job.
      const end = sub.current_end ? new Date(sub.current_end * 1000) : null;
      await setSubscriptionStatus(sub.id, STATUS_FOR_EVENT[event.event], end);
    }
  } catch (err) {
    Sentry.captureException(err, { extra: { razorpayEvent: event.event, subscriptionId: sub.id } });
    return NextResponse.json({ error: "Failed to process" }, { status: 500 });
  }
  return NextResponse.json({ received: true });
}
