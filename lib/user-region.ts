import { setUserRegionIfMissing, type UserRow } from "./db";
import { getCountryFromHeaders, getTierForCountry } from "./pricing-region";

/**
 * Makes sure a signed-in user has a country + pricing tier saved, detecting
 * it from the current request if missing. Covers everyone the signup-time
 * capture misses: Google/LinkedIn signups and accounts created before
 * regional pricing launched. Once saved it never changes (see
 * setUserRegionIfMissing), so the price a user sees is the price they pay.
 *
 * Call it anywhere a price is shown or charged (pricing page, checkout) and
 * on the dashboard, so the admin Users/Subscriptions pages fill in quickly.
 */
export async function ensureUserRegion(user: UserRow, headers: Headers): Promise<UserRow> {
  if (user.country_code) return user;
  const country = getCountryFromHeaders(headers);
  if (!country) return user; // not on Vercel (local dev) - nothing reliable to save
  const updated = await setUserRegionIfMissing(user.id, country.toUpperCase(), getTierForCountry(country));
  return updated ?? user;
}
