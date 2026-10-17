/**
 * What's configured in this environment, in one place, so the System page,
 * the Overview warning and the Subscriptions page all agree. These only
 * check that the variables exist - not that the credentials are valid.
 */
export function getPaymentsStatus(env: Record<string, string | undefined> = process.env) {
  const missing: string[] = [];
  if (!env.RAZORPAY_KEY_ID) missing.push("RAZORPAY_KEY_ID");
  if (!env.RAZORPAY_KEY_SECRET) missing.push("RAZORPAY_KEY_SECRET");
  if (!env.RAZORPAY_WEBHOOK_SECRET) missing.push("RAZORPAY_WEBHOOK_SECRET");
  return {
    /** People can pay, and payments are confirmed even if the buyer closes the tab. */
    ready: missing.length === 0,
    /** At least checkout works. */
    partlyReady: Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET),
    /** Test keys take no real money. */
    testMode: Boolean(env.RAZORPAY_KEY_ID?.startsWith("rzp_test_")),
    /** Prices outside India can be paid (needs Razorpay's approval first). */
    international: env.RAZORPAY_INTERNATIONAL?.trim().toLowerCase() === "on",
    missing,
  };
}

export function getIntegrations() {
  const payments = getPaymentsStatus();
  return [
    { name: "Anthropic (AI features)", configured: Boolean(process.env.ANTHROPIC_API_KEY), critical: true },
    {
      name: "Razorpay (payments)",
      configured: payments.ready,
      critical: true,
      note: payments.ready
        ? payments.testMode
          ? "Test keys: no real money is taken"
          : undefined
        : `Missing: ${payments.missing.join(", ")}`,
    },
    { name: "Google (Sign in + Drive export)", configured: Boolean(process.env.GOOGLE_CLIENT_ID) },
    { name: "LinkedIn (Sign in)", configured: Boolean(process.env.LINKEDIN_CLIENT_ID) },
    { name: "Resend (emails: verification, password reset, support alerts)", configured: Boolean(process.env.RESEND_API_KEY) },
    { name: "Sentry (error tracking)", configured: Boolean(process.env.SENTRY_DSN) },
  ];
}
