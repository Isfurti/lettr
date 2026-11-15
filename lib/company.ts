/**
 * Who runs Lettr. Used by the footer, legal pages, the help page and GST
 * invoices, so the details only live in one place.
 *
 * Lettr is sold by Noonscope Media Pvt. Ltd. Set SELLER to null to show just
 * "Lettr" on every page and switch GST invoices off.
 */

export type Seller = {
  legalName: string;
  addressLines: string[];
  city: string;
  state: string;
  /** GST state code, e.g. "09" for Uttar Pradesh. */
  stateCode: string;
  gstin: string;
  /** Logo printed on invoices, under /public. */
  logoPath?: string;
  /** The company's own website, linked from the footer. */
  website?: string;
};

/**
 * The company's GSTIN and street address come from environment variables, not
 * the code, because this repository is public. Set them in Vercel (and in
 * .env.local for local runs):
 *   COMPANY_GSTIN     the 15-character GSTIN; "off" switches GST invoices off
 *   COMPANY_ADDRESS   address lines separated by "|", e.g. "Line 1|Line 2"
 * Without COMPANY_GSTIN no GST invoice is issued.
 */
function gstinFromEnv(env: Record<string, string | undefined> = process.env): string {
  const raw = env.COMPANY_GSTIN?.trim().toUpperCase() ?? "";
  return raw === "OFF" ? "" : raw;
}

function addressFromEnv(env: Record<string, string | undefined> = process.env): string[] {
  return (env.COMPANY_ADDRESS ?? "")
    .split("|")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** The legal entity Lettr is sold under. Set to null to hide company details and switch invoices off. */
export const SELLER: Seller | null = {
  legalName: "Noonscope Media Pvt. Ltd.",
  addressLines: addressFromEnv(),
  city: "Meerut",
  state: "Uttar Pradesh",
  stateCode: "09",
  gstin: gstinFromEnv(),
  logoPath: "/brand/noonscope-logo.png",
  website: "https://noonscope.com",
};

export const COMPANY = {
  productName: "Lettr",
  country: "India",
  /** Public contact email. Null to send people to the contact form instead. */
  contactEmail: "support@getlettr.com" as string | null,
  /** Where people reach us when there's no public email. */
  contactUrl: "/support",
  founder: { name: "Sagar Agarwal", title: "Founder" },
  /** Lettr doesn't offer a money-back guarantee for now (see the terms' refund section). */
  moneyBackGuarantee: false,
};

/** The full stop to end a sentence after `text`, or nothing when it already ends with one ("Pvt. Ltd."). */
export function sentenceEnd(text?: string | null): string {
  return text?.endsWith(".") ? "" : ".";
}

/** Who's behind Lettr, for one line of text: the company if there is one, otherwise just "Lettr". */
export function operatorName(seller: Seller | null = SELLER): string {
  return seller?.legalName ?? COMPANY.productName;
}

export type GstConfig = {
  gstin: string;
  /** Services Accounting Code printed on invoices. Confirm with your CA. */
  sac: string;
  /** Prefix before the financial year and serial, e.g. "LTR" → LTR/2026-27/0001. */
  invoicePrefix: string;
};

/**
 * LUT (Letter of Undertaking) acknowledgement numbers by financial year.
 * Export invoices (buyers outside India) are zero-rated under the LUT, which
 * is filed again every financial year: add the new ARN here each April.
 */
export const LUT_ARNS: Record<string, string> = {
  "2026-27": "AD0910260431486",
};

/** The LUT ARN covering an invoice's financial year, or null if none is on record. */
export function lutArnFor(financialYear: string): string | null {
  return LUT_ARNS[financialYear] ?? null;
}

/**
 * GST settings for invoices, or null when invoicing is off: there's no
 * company yet, or it's switched off with COMPANY_GSTIN=off. COMPANY_SAC and
 * INVOICE_PREFIX can be changed with environment variables.
 */
export function getGstConfig(
  env: Record<string, string | undefined> = process.env,
  seller: Seller | null = SELLER
): GstConfig | null {
  if (!seller) return null;
  const raw = env.COMPANY_GSTIN?.trim().toUpperCase();
  if (raw === "OFF") return null;
  const gstin = raw || seller.gstin;
  if (!gstin) return null; // no GSTIN configured: don't issue invoices
  return {
    gstin,
    sac: env.COMPANY_SAC?.trim() || "998319",
    invoicePrefix: env.INVOICE_PREFIX?.trim() || "LTR",
  };
}
