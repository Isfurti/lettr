import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { getPaymentRecord } from "@/lib/db";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { fulfilProPayment } from "@/lib/pro-payments";

/**
 * Called by the browser right after Razorpay Checkout succeeds. The signature
 * proves Razorpay took the payment for this order, so Pro is switched on at
 * once instead of waiting for the webhook.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => ({}));
  const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";

  const order = orderId ? await getPaymentRecord(orderId) : undefined;
  if (!order || order.user_id !== userId) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  if (!verifyPaymentSignature({ orderId, paymentId, signature })) {
    Sentry.captureMessage("Razorpay checkout signature did not match", { level: "warning", extra: { orderId, paymentId } });
    return NextResponse.json({ error: "We couldn't confirm this payment. If money was taken, contact support." }, { status: 400 });
  }

  try {
    await fulfilProPayment(orderId, paymentId);
  } catch (err) {
    Sentry.captureException(err, { extra: { orderId, paymentId } });
    return NextResponse.json(
      { error: "Your payment went through, but Pro didn't switch on yet. It will within a few minutes, or contact support." },
      { status: 500 }
    );
  }
  return NextResponse.json({ ok: true });
}
