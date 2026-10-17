import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { fulfilProPayment } from "@/lib/pro-payments";
import { getPaymentRecord } from "@/lib/db";

/**
 * Razorpay webhook (Razorpay dashboard → Webhooks → this URL, events
 * "order.paid" and "payment.captured"). Backs up the checkout: if the
 * buyer closed the tab before the checkout confirmed, Pro still switches on.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  if (!verifyWebhookSignature(rawBody, req.headers.get("x-razorpay-signature"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: { event?: string; payload?: { payment?: { entity?: { id?: string; order_id?: string } } } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

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
