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
};

/** The legal entity Lettr is sold under. Set to null to hide company details and switch invoices off. */
export const SELLER: Seller | null = {
  legalName: "Noonscope Media Pvt. Ltd.",
  addressLines: ["D-42, Surya Palace, Delhi Road", "Meerut 250001, Uttar Pradesh, India"],
  city: "Meerut",
  state: "Uttar Pradesh",
  stateCode: "09",
  gstin: "09AALCN4402B1ZS",
  logoPath: "/brand/noonscope-logo.png",
};

export const COMPANY = {
  productName: "Lettr",
  country: "India",
  /** Public contact email. Null to send people to the contact form instead. */
  contactEmail: "support@noonscope.com" as string | null,
  /** Where people reach us when there's no public email. */
  contactUrl: "/support",
  grievanceOfficer: { name: "Sagar Agarwal" },
  founder: { name: "Sagar Agarwal", title: "Founder" },
  /** Lettr doesn't offer a money-back guarantee for now (see the terms' refund section). */
  moneyBackGuarantee: false,
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
