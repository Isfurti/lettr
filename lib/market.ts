import type { ResumeCustomization } from "./types";

/**
 * "Applying in": the job market a resume is aimed at. It changes the advice
 * Lettr gives (AI suggestions, ATS tips) and the default page size. Unset
 * means neutral advice, so older resumes behave exactly as before.
 */
export const MARKET_IDS = ["IN", "US", "UK", "EU", "GULF"] as const;
export type Market = (typeof MARKET_IDS)[number];

export type MarketInfo = {
  id: Market;
  label: string;
  hint: string;
  pageSize: "A4" | "LETTER";
  /** An example phone number in the local format. */
  phoneExample: string;
  /** Plain-English norms handed to the AI so its suggestions fit the market. */
  guidance: string;
};

export const MARKETS: Record<Market, MarketInfo> = {
  IN: {
    id: "IN",
    label: "India",
    hint: "Indian employers",
    pageSize: "A4",
    phoneExample: "+91 98765 43210",
    guidance:
      "The candidate is applying to employers in India. Indian recruiters often phone first, so a reachable phone number matters. A photo and personal details are optional and not needed. One page suits under about 8 years of experience. Notice period and current city are useful to mention only if the candidate gives them.",
  },
  US: {
    id: "US",
    label: "USA",
    hint: "US employers",
    pageSize: "LETTER",
    phoneExample: "+1 415 555 0132",
    guidance:
      "The candidate is applying to employers in the United States. Use American spelling in any new text and call the document a resume. No photo, and no date of birth, marital status, nationality or religion, which US employers avoid. Do not add 'references available on request'. One page is the norm; two only with many years of experience. Lead bullets with measurable impact.",
  },
  UK: {
    id: "UK",
    label: "UK",
    hint: "UK employers",
    pageSize: "A4",
    phoneExample: "+44 7700 900123",
    guidance:
      "The candidate is applying to employers in the United Kingdom. Use British spelling in any new text and call the document a CV. No photo, and no date of birth, marital status or nationality. A short personal profile at the top suits UK CVs better than an objective. Do not add 'references available on request'. Two pages is normal.",
  },
  EU: {
    id: "EU",
    label: "Europe",
    hint: "European employers",
    pageSize: "A4",
    phoneExample: "+49 151 23456789",
    guidance:
      "The candidate is applying to employers in Europe. Keep the resume's own spelling. Two pages is fine. A small professional photo is common in some countries (for example Germany, France, Spain, Italy) but optional. If languages are listed, say the level. Do not require the Europass format.",
  },
  GULF: {
    id: "GULF",
    label: "Gulf",
    hint: "UAE, Saudi, Qatar and nearby",
    pageSize: "A4",
    phoneExample: "+971 50 123 4567",
    guidance:
      "The candidate is applying to employers in the Gulf (UAE, Saudi Arabia, Qatar and nearby). Recruiters often like to see nationality, visa status and notice period near the top, only if the candidate provides them. A professional photo is acceptable. Two pages is fine. Keep the language formal.",
  },
};

export function marketOf(c: ResumeCustomization | undefined): Market | null {
  const m = c?.market;
  return m && (MARKET_IDS as readonly string[]).includes(m) ? m : null;
}

/** A guidance paragraph for AI prompts, or "" when no market is chosen. */
export function marketGuidance(m: Market | null | undefined): string {
  return m && MARKETS[m] ? `Market: ${MARKETS[m].guidance}` : "";
}

/** Accepts anything (request bodies, old data) and returns a valid market or undefined. */
export function parseMarket(v: unknown): Market | undefined {
  return typeof v === "string" && (MARKET_IDS as readonly string[]).includes(v) ? (v as Market) : undefined;
}

/** A starting guess from a visitor's country code, used only to pre-select the chip. */
export function marketFromCountry(cc: string | null | undefined): Market | undefined {
  const c = (cc || "").toUpperCase();
  if (c === "IN") return "IN";
  if (c === "US" || c === "CA") return "US";
  if (c === "GB") return "UK";
  if (["AE", "SA", "QA", "KW", "OM", "BH"].includes(c)) return "GULF";
  if (
    ["DE", "FR", "ES", "IT", "NL", "BE", "IE", "PT", "SE", "DK", "FI", "NO", "PL", "AT", "CH", "CZ", "GR", "RO", "HU"].includes(c)
  )
    return "EU";
  return undefined;
}
