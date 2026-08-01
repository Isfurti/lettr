/**
 * Detects the visitor's country from Vercel's automatic geolocation header.
 * This works on Vercel deployments with zero configuration - no third-party
 * geolocation API needed. Falls back to "US" (full price, the safe default)
 * when the header isn't present, e.g. local development.
 */
export function getCountryFromHeaders(headers: Headers): string {
  return headers.get("x-vercel-ip-country") || "US";
}
