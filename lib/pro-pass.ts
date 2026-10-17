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
