/**
 * What's configured in this environment, in one place, so the System page,
 * the Overview warning and the Subscriptions page all agree. These only
 * check that the variables exist - not that the credentials are valid.
 */
export function getStripeStatus() {
  const secretKey = Boolean(process.env.STRIPE_SECRET_KEY);
  const prices = {
    full: Boolean(process.env.STRIPE_PRO_PRICE_ID_FULL || process.env.STRIPE_PRO_PRICE_ID),
    mid: Boolean(process.env.STRIPE_PRO_PRICE_ID_MID),
    value: Boolean(process.env.STRIPE_PRO_PRICE_ID_VALUE),
  };
  const webhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const missing: string[] = [];
  if (!secretKey) missing.push("STRIPE_SECRET_KEY");
  if (!prices.full) missing.push("STRIPE_PRO_PRICE_ID_FULL");
  if (!prices.mid) missing.push("STRIPE_PRO_PRICE_ID_MID");
  if (!prices.value) missing.push("STRIPE_PRO_PRICE_ID_VALUE");
  if (!webhook) missing.push("STRIPE_WEBHOOK_SECRET");
  return {
    /** Every region can check out and payments get recorded. */
    ready: missing.length === 0,
    /** At least some people could pay. */
    partlyReady: secretKey && (prices.full || prices.mid || prices.value),
    missing,
  };
}

export function getIntegrations() {
  const stripe = getStripeStatus();
  return [
    { name: "Anthropic (AI features)", configured: Boolean(process.env.ANTHROPIC_API_KEY), critical: true },
    {
      name: "Stripe (payments)",
      configured: stripe.ready,
      critical: true,
      note: stripe.ready ? undefined : `Missing: ${stripe.missing.join(", ")}`,
    },
    { name: "Google (Sign in + Drive export)", configured: Boolean(process.env.GOOGLE_CLIENT_ID) },
    { name: "LinkedIn (Sign in)", configured: Boolean(process.env.LINKEDIN_CLIENT_ID) },
    { name: "Resend (emails: verification, password reset, support alerts)", configured: Boolean(process.env.RESEND_API_KEY) },
    { name: "Sentry (error tracking)", configured: Boolean(process.env.SENTRY_DSN) },
  ];
}
