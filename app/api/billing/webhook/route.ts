import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { constructWebhookEvent } from "@/lib/stripe";
import { applyStripeEvent } from "@/lib/billing-webhook-handler";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const rawBody = await req.text();

  let event;
  try {
    event = constructWebhookEvent(rawBody, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook signature";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    await applyStripeEvent(event);
  } catch (err) {
    // Return 500 so Stripe retries delivery - swallowing this would silently
    // desync a user's plan state from what they actually paid for.
    Sentry.captureException(err, { extra: { stripeEventType: event.type, stripeEventId: event.id } });
    const message = err instanceof Error ? err.message : "Failed to process webhook event";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
