/**
 * Where visitors must opt in before ad and analytics cookies load: the EU,
 * the rest of the EEA, the UK and Switzerland (GDPR / ePrivacy, and Google's
 * EU user consent policy). Everywhere else tracking is on by default and can
 * be switched off from "Cookie settings" in the footer.
 */
const OPT_IN_COUNTRIES = new Set([
  // EU
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT",
  "NL", "PL", "PT", "RO", "SK", "SI", "ES", "SE",
  // Rest of the EEA, the UK and Switzerland
  "IS", "LI", "NO", "GB", "CH",
]);

/** True when the visitor must choose "Allow" first. Unknown country: ask, to be safe. */
export function consentRequired(countryCode: string | null | undefined): boolean {
  const code = countryCode?.trim().toUpperCase();
  if (!code) return true;
  return OPT_IN_COUNTRIES.has(code);
}
