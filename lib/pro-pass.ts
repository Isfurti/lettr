import type { PlanId, RegionPrices } from "./plans";

/**
 * Pro is sold as one-time passes: pay once for 1, 3 or 12 months, no
 * automatic renewal. Buying again while Pro is still running adds the new
 * months after the time that's left. Pure helpers only (no database), so
 * they can be unit tested.
 */
export const PRO_PASSES: Record<PlanId, { months: number; name: string }> = {
  monthly: { months: 1, name: "1-month pass" },
  quarter: { months: 3, name: "3-month pass" },
  yearly: { months: 12, name: "12-month pass" },
};

export function isPlanId(value: unknown): value is PlanId {
  return value === "monthly" || value === "quarter" || value === "yearly";
}

/** The pass price in the currency's smallest unit (paise, cents), as Razorpay expects. */
export function passAmountMinor(prices: RegionPrices, plan: PlanId): number {
  return Math.round(prices[plan] * 100);
}

/** What the invoice and the Razorpay checkout call it, e.g. "Lettr Pro - 3-month pass". */
export function passDescription(plan: PlanId): string {
  return `Lettr Pro - ${PRO_PASSES[plan].name}`;
}

/** Pro that someone paid for has an end date; Pro given by the Lettr team doesn't. */
export function hasPaidPro(user: { plan: string; pro_until: string | Date | null }): boolean {
  return user.plan === "pro" && user.pro_until != null;
}

/** True when a paid Pro pass has run out and the person should be back on Free. */
export function proHasLapsed(user: { plan: string; pro_until: string | Date | null }, now: Date = new Date()): boolean {
  if (!hasPaidPro(user)) return false;
  return new Date(user.pro_until as string | Date).getTime() < now.getTime();
}

/** Days before the end of Pro that the "your Pro ends soon" email goes out. */
export const PRO_REMINDER_DAYS = 3;

/** e.g. "17 Jan 2027", in India time. */
export function formatProDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

/* ---------- Auto-renewing monthly Pro ---------- */

/**
 * Days of Pro kept after the paid month ends. Razorpay retries a failed
 * renewal on the next three days, so Pro shouldn't switch off in between.
 */
export const AUTO_RENEW_GRACE_DAYS = 3;

/** Days before a renewal that the "renews soon" email goes out. */
export const RENEWAL_REMINDER_DAYS = 3;

export const AUTO_RENEW_DESCRIPTION = "Lettr Pro - monthly, renews automatically";

/** The auto-renew price for this region in minor units, or null if the region has no auto-renew offer. */
export function autoRenewAmountMinor(prices: RegionPrices): number | null {
  if (prices.currency === "INR" || !prices.autoMonthly) return null;
  return Math.round(prices.autoMonthly * 100);
}

/** When Pro should end for a subscription whose paid month ends at `currentEnd` (unix seconds). */
export function autoRenewProUntil(currentEnd: number | null, now: Date = new Date()): Date {
  const base = currentEnd ? new Date(currentEnd * 1000) : addMonths(now, 1);
  return new Date(base.getTime() + AUTO_RENEW_GRACE_DAYS * 86_400_000);
}

function addMonths(d: Date, months: number): Date {
  const out = new Date(d);
  out.setUTCMonth(out.getUTCMonth() + months);
  return out;
}

/** The Razorpay plan cache key, so each price gets one plan, e.g. "USD_1900". */
export function autoRenewPlanKey(currency: string, amountMinor: number): string {
  return `${currency.toUpperCase()}_${amountMinor}`;
}
