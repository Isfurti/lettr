/**
 * Who runs Lettr. Used by the footer, legal pages, the help page and GST
 * invoices, so the details only live in one place.
 *
 * Lettr is not launching under Noonscope. Until the new company is set up,
 * SELLER is null: pages just say "Lettr", people reach us through the
 * contact form, and GST invoices are switched off. When the company is
 * ready, fill in SELLER (and a contact email) and everything picks it up.
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
};

/** The legal entity Lettr is sold under. Null until the new company is ready. */
export const SELLER: Seller | null = null;

export const COMPANY = {
  productName: "Lettr",
  country: "India",
  /** Public contact email. Null until the new company has one; the contact form is used instead. */
  contactEmail: null as string | null,
  /** Where people reach us when there's no public email. */
  contactUrl: "/support",
  grievanceOfficer: { name: "Sagar Agarwal" },
};

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
  return {
    gstin: raw || seller.gstin,
    sac: env.COMPANY_SAC?.trim() || "998314",
    invoicePrefix: env.INVOICE_PREFIX?.trim() || "LTR",
  };
}
