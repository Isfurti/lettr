import type Stripe from "stripe";
import * as Sentry from "@sentry/nextjs";
import { getUserByStripeCustomerId, setStripeCustomerId, updateUserPlan } from "./db";
import { issueGstInvoice } from "./invoices";

/**
 * Applies the effect of a Stripe event to our database. Kept separate from
 * the HTTP route / signature verification so it can be unit tested with
 * hand-built event objects instead of requiring a live Stripe webhook call.
 */
export async function applyStripeEvent(event: Stripe.Event): Promise<void> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId ?? session.client_reference_id;
      const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
      if (!userId || !customerId) break;

      await setStripeCustomerId(userId, customerId);
      await updateUserPlan({
        userId,
        plan: "pro",
        stripeSubscriptionId:
          typeof session.subscription === "string" ? session.subscription : session.subscription?.id,
      });
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const user = await getUserByStripeCustomerId(customerId);
      if (!user) break;

      const isActive = subscription.status === "active" || subscription.status === "trialing";
      await updateUserPlan({
        userId: user.id,
        plan: isActive ? "pro" : "free",
        stripeSubscriptionId: subscription.id,
      });
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
      const user = await getUserByStripeCustomerId(customerId);
      if (!user) break;

      await updateUserPlan({ userId: user.id, plan: "free", stripeSubscriptionId: null });
      break;
    }

    case "invoice.paid": {
      // Every successful charge gets a GST invoice in Noonscope's name.
      // Failures here are reported but never fail the webhook - the payment
      // itself already succeeded and Stripe would otherwise retry forever.
      const invoice = event.data.object as Stripe.Invoice;
      if (!invoice.amount_paid || invoice.amount_paid <= 0) break;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      const user = customerId ? await getUserByStripeCustomerId(customerId) : undefined;
      try {
        await issueGstInvoice({
          userId: user?.id ?? null,
          buyerName: invoice.customer_name ?? user?.name ?? null,
          buyerEmail: invoice.customer_email ?? user?.email ?? "unknown",
          buyerCountry: invoice.customer_address?.country ?? user?.country_code ?? "IN",
          description: `${invoice.lines?.data?.[0]?.description || "Lettr Pro"}`,
          currency: invoice.currency,
          total: invoice.amount_paid,
          paymentRef: `stripe:${invoice.id}`,
          issuedAt: new Date((invoice.status_transitions?.paid_at ?? invoice.created) * 1000),
        });
      } catch (err) {
        Sentry.captureException(err, { extra: { stripeInvoiceId: invoice.id } });
      }
      break;
    }

    case "invoice.payment_failed": {
      // We don't immediately downgrade on a failed payment - Stripe's own
      // retry schedule (Smart Retries) will keep trying, and
      // customer.subscription.updated fires separately if the subscription
      // ultimately gets cancelled. This case exists purely for visibility:
      // surface it to Sentry so a human finds out a real charge failed,
      // since that's revenue-affecting and worth a human looking at it.
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;
      const user = customerId ? await getUserByStripeCustomerId(customerId) : undefined;

      Sentry.captureMessage("Stripe payment failed", {
        level: "warning",
        extra: {
          customerId,
          userId: user?.id,
          userEmail: user?.email,
          invoiceId: invoice.id,
          amountDue: invoice.amount_due,
          attemptCount: invoice.attempt_count,
        },
      });
      break;
    }

    default:
      // Unhandled event types are ignored on purpose - Stripe sends many
      // event types we don't need to react to.
      break;
  }
}
