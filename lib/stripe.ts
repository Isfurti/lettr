import Stripe from "stripe";

function getStripeClient(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to your .env.local (local dev) or your hosting provider's environment variables (production) to enable billing.");
  }
  return new Stripe(key);
}

function getAppUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

function getPriceIdForTier(tier: string): string | undefined {
  const tierEnvVar: Record<string, string | undefined> = {
    full: process.env.STRIPE_PRO_PRICE_ID_FULL || process.env.STRIPE_PRO_PRICE_ID, // legacy fallback
    mid: process.env.STRIPE_PRO_PRICE_ID_MID,
    value: process.env.STRIPE_PRO_PRICE_ID_VALUE,
  };
  return tierEnvVar[tier];
}

export async function createCheckoutSession(params: {
  userId: string;
  email: string;
  existingStripeCustomerId?: string | null;
  pricingTier?: string;
}): Promise<string> {
  const stripe = getStripeClient();
  const tier = params.pricingTier || "full";
  const priceId = getPriceIdForTier(tier);
  if (!priceId) {
    throw new Error(
      `No Stripe Price configured for the "${tier}" pricing tier. Create a Price in Stripe for this region and set ` +
        `STRIPE_PRO_PRICE_ID_${tier.toUpperCase()}.`
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: params.existingStripeCustomerId ?? undefined,
    customer_email: params.existingStripeCustomerId ? undefined : params.email,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${getAppUrl()}/dashboard?upgraded=true`,
    cancel_url: `${getAppUrl()}/pricing`,
    client_reference_id: params.userId,
    metadata: { userId: params.userId, pricingTier: tier },
    subscription_data: { metadata: { userId: params.userId, pricingTier: tier } },
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}

export async function createBillingPortalSession(stripeCustomerId: string): Promise<string> {
  const stripe = getStripeClient();
  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${getAppUrl()}/dashboard`,
  });
  return session.url;
}

export function constructWebhookEvent(rawBody: string, signature: string): Stripe.Event {
  const stripe = getStripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("STRIPE_WEBHOOK_SECRET is not set. Add it to your .env.local (local dev) or your hosting provider's environment variables (production) to verify webhooks.");
  }
  return stripe.webhooks.constructEvent(rawBody, signature, secret);
}

export default getStripeClient;
