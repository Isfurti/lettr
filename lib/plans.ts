import { getTierForCountry, type PricingTier } from "./pricing-region";

/**
 * Pro plan prices shown on the pricing page, per price region.
 *
 * Display only for now: checkout is wired up just before launch, and until
 * then the plan buttons say "Opens at launch" so nobody is charged a price
 * that doesn't match this page. India prices include GST.
 */
export type PlanId = "monthly" | "quarter" | "yearly";

export type RegionPrices = {
  region: string;
  /** Formats a whole-number amount in the region's currency, e.g. 699 → "₹699". */
  format: (amount: number) => string;
  monthly: number;
  quarter: number;
  yearly: number;
  taxNote?: string;
};

const fmt = (symbol: string, locale = "en-US") => (n: number) => `${symbol}${n.toLocaleString(locale)}`;

export const REGION_PRICES: Record<string, RegionPrices> = {
  IN: { region: "India", format: fmt("₹", "en-IN"), monthly: 699, quarter: 1499, yearly: 3999, taxNote: "Prices include GST." },
  US: { region: "Standard", format: fmt("$"), monthly: 24, quarter: 49, yearly: 149 },
  GB: { region: "United Kingdom", format: fmt("£"), monthly: 19, quarter: 39, yearly: 119 },
  EU: { region: "Europe", format: fmt("€"), monthly: 22, quarter: 45, yearly: 139 },
  AU: { region: "Australia", format: fmt("A$"), monthly: 35, quarter: 72, yearly: 219 },
  MID: { region: "Regional", format: fmt("$"), monthly: 12, quarter: 25, yearly: 75 },
  VALUE: { region: "Regional", format: fmt("$"), monthly: 6, quarter: 12, yearly: 39 },
};

const EURO_COUNTRIES = new Set([
  "AT", "BE", "CY", "DE", "EE", "ES", "FI", "FR", "GR", "HR", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PT", "SI", "SK",
]);

/** Picks the price region for a country (saved tier wins over the country's default tier for USD regions). */
export function getRegionPrices(countryCode: string | null | undefined, savedTier?: string | null): RegionPrices {
  const code = countryCode?.toUpperCase() ?? "";
  if (code === "IN") return REGION_PRICES.IN;
  if (code === "GB") return REGION_PRICES.GB;
  if (code === "AU") return REGION_PRICES.AU;
  if (EURO_COUNTRIES.has(code)) return REGION_PRICES.EU;
  const tier: PricingTier =
    savedTier === "full" || savedTier === "mid" || savedTier === "value" ? savedTier : getTierForCountry(code);
  if (tier === "value") return REGION_PRICES.VALUE;
  if (tier === "mid") return REGION_PRICES.MID;
  return REGION_PRICES.US;
}

/** Percentage saved versus paying monthly for the same number of months, rounded down. */
export function savingsPercent(prices: RegionPrices, plan: PlanId): number {
  const months = plan === "quarter" ? 3 : plan === "yearly" ? 12 : 1;
  const total = plan === "quarter" ? prices.quarter : plan === "yearly" ? prices.yearly : prices.monthly;
  return Math.max(0, Math.floor((1 - total / (prices.monthly * months)) * 100));
}

/** What one month works out to on a longer plan, rounded to a whole number. */
export function perMonth(prices: RegionPrices, plan: PlanId): number {
  if (plan === "quarter") return Math.round(prices.quarter / 3);
  if (plan === "yearly") return Math.round(prices.yearly / 12);
  return prices.monthly;
}
