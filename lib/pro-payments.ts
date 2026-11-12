import * as Sentry from "@sentry/nextjs";
import { markPaymentPaid, recordSubscriptionCharge } from "./db";
import { issueGstInvoice } from "./invoices";
import { sendAutoRenewStartedEmail, sendProConfirmationEmail, sendRenewalReceiptEmail } from "./email";
import { autoRenewProUntil, formatProDate, isPlanId, PRO_PASSES, passDescription, RENEWAL_PERIOD, renewingDescription } from "./pro-pass";

/**
 * Records a successful Pro pass payment: adds the months of Pro, makes the
 * GST invoice and emails a confirmation. Called by the checkout (right after
 * paying) and by the Razorpay webhook (in case the browser closed first).
 * Whichever arrives second finds the order already paid and does nothing.
 * Returns true if this call is the one that added the time.
 */
export async function fulfilProPayment(orderId: string, paymentId: string): Promise<boolean> {
  const result = await markPaymentPaid(orderId, paymentId);
  if (!result) return false;
  const { payment, user } = result;
  const plan = isPlanId(payment.plan_id) ? payment.plan_id : "monthly";

  // The payment already went through, so a problem with the invoice or email
  // is reported, never allowed to undo or fail it.
  try {
    await issueGstInvoice({
      userId: user?.id ?? null,
      buyerName: user?.name ?? null,
      buyerEmail: user?.email ?? "unknown",
      buyerCountry: user?.country_code ?? "IN",
      description: passDescription(plan),
      currency: payment.currency,
      total: payment.amount,
      paymentRef: `razorpay:${paymentId}`,
    });
  } catch (err) {
    Sentry.captureException(err, { extra: { orderId, paymentId } });
  }
  if (user?.email && user.pro_until) {
    await sendProConfirmationEmail({
      email: user.email,
      passName: PRO_PASSES[plan].name,
      proUntil: formatProDate(user.pro_until),
    }).catch((err) => Sentry.captureException(err));
  }
  return true;
}

/**
 * Records one charge on a renewing plan (the first one or a renewal): moves
 * Pro's end date, makes the invoice and emails the buyer. Called by the
 * checkout and by the Razorpay webhook; whichever arrives second does nothing.
 */
export async function fulfilSubscriptionCharge(p: {
  subscriptionId: string;
  paymentId: string;
  amount: number;
  currency: string;
  /** Unix seconds: end of the period just paid for, if Razorpay told us. */
  currentEnd: number | null;
  /** The plan, if the caller knows it; used only for the fallback end date. */
  plan?: string;
}): Promise<boolean> {
  const plan = isPlanId(p.plan) ? p.plan : "monthly";
  const months = PRO_PASSES[plan].months;
  const currentEnd = p.currentEnd ? new Date(p.currentEnd * 1000) : null;
  const result = await recordSubscriptionCharge({
    subscriptionId: p.subscriptionId,
    paymentId: p.paymentId,
    amount: p.amount,
    currency: p.currency,
    currentEnd,
    proUntil: autoRenewProUntil(p.currentEnd, months),
  });
  if (!result) return false;
  const { user, first, sub } = result;
  const subPlan = isPlanId(sub.plan_id) ? sub.plan_id : plan;

  try {
    await issueGstInvoice({
      userId: user?.id ?? null,
      buyerName: user?.name ?? null,
      buyerEmail: user?.email ?? "unknown",
      buyerCountry: user?.country_code ?? "IN",
      description: renewingDescription(subPlan),
      currency: p.currency,
      total: p.amount,
      paymentRef: `razorpay:${p.paymentId}`,
    });
  } catch (err) {
    Sentry.captureException(err, { extra: { subscriptionId: p.subscriptionId, paymentId: p.paymentId } });
  }
  if (user?.email) {
    const details = {
      email: user.email,
      price: formatMinor(p.amount, p.currency),
      period: RENEWAL_PERIOD[subPlan],
      renewsOn: formatProDate(currentEnd ?? autoRenewProUntil(null, PRO_PASSES[subPlan].months)),
    };
    const send = first ? sendAutoRenewStartedEmail : sendRenewalReceiptEmail;
    await send(details).catch((err) => Sentry.captureException(err));
  }
  return true;
}

/** e.g. 1900 USD → "$19", 59900 INR → "₹599". */
export function formatMinor(amount: number, currency: string): string {
  const value = amount / 100;
  return new Intl.NumberFormat(currency === "INR" ? "en-IN" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}
