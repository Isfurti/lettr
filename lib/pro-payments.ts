import * as Sentry from "@sentry/nextjs";
import { markPaymentPaid } from "./db";
import { issueGstInvoice } from "./invoices";
import { sendProConfirmationEmail } from "./email";
import { formatProDate, isPlanId, PRO_PASSES, passDescription } from "./pro-pass";

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
