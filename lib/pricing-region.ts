export type PricingTier = "full" | "mid" | "value";

export const PRICING_TIERS: Record<PricingTier, { label: string; usd: number; displayPrice: string }> = {
  full: { label: "Standard", usd: 19, displayPrice: "$19" },
  mid: { label: "Regional", usd: 9, displayPrice: "$9" },
  // India shown in INR specifically since it's a named target market with
  // Razorpay planned - other value-tier countries show the USD figure
  // since we don't yet have per-currency display built for them.
  value: { label: "Regional", usd: 5, displayPrice: "$5" },
};

export const INDIA_DISPLAY_PRICE = "₹399";

/**
 * Country → tier classification, based on World Bank income groupings.
 * This is a starting classification, not exhaustive - any country code
 * not listed here defaults to "full" (see getTierForCountry) rather than
 * silently under-charging for a country nobody explicitly reviewed yet.
 */
const MID_TIER_COUNTRIES = new Set([
  "CN", "BR", "MX", "TR", "MY", "ZA", "RU", "AR", "TH", "CO", "PE", "RO", "BG",
]);

const VALUE_TIER_COUNTRIES = new Set([
  "IN", "ID", "PH", "VN", "EG", "NG", "PK", "BD", "KE", "GH", "NP", "LK",
]);

export function getTierForCountry(countryCode: string | null | undefined): PricingTier {
  const code = countryCode?.toUpperCase();
  if (!code) return "full";
  if (VALUE_TIER_COUNTRIES.has(code)) return "value";
  if (MID_TIER_COUNTRIES.has(code)) return "mid";
  return "full";
}

/**
 * The actual price to charge/display for a given country. India is
 * special-cased to INR since that's the explicitly planned Razorpay market;
 * everywhere else uses the tier's USD figure.
 */
export function getDisplayPriceForCountry(countryCode: string | null | undefined): { tier: PricingTier; display: string } {
  const tier = getTierForCountry(countryCode);
  if (countryCode?.toUpperCase() === "IN") {
    return { tier, display: INDIA_DISPLAY_PRICE };
  }
  return { tier, display: PRICING_TIERS[tier].displayPrice };
}

/**
 * Extracts the visitor's country from Vercel's edge-injected geolocation
 * header. Vercel sets this at the edge based on real IP geolocation and
 * overwrites any client-supplied value before it reaches the app - it's
 * not something a client can spoof by sending their own header. Returns
 * null in local dev (Vercel isn't in the request path) or on any other
 * host that doesn't set it.
 */
export function getCountryFromHeaders(headers: Headers): string | null {
  return headers.get("x-vercel-ip-country");
}
