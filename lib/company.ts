/**
 * The legal entity behind Lettr. Used by the footer, legal pages, the help
 * page and GST invoices, so the details only live in one place.
 *
 * The SAC code and invoice prefix can be changed with environment variables
 * (COMPANY_SAC, INVOICE_PREFIX) once your CA confirms them. Invoices are
 * switched off if the GSTIN is cleared (COMPANY_GSTIN=off).
 */
export const COMPANY = {
  productName: "Lettr",
  legalName: "Noonscope Media Pvt. Ltd.",
  addressLines: ["D-42, Surya Palace, Delhi Road", "Meerut 250001, Uttar Pradesh, India"],
  city: "Meerut",
  state: "Uttar Pradesh",
  /** GST state code for Uttar Pradesh. */
  stateCode: "09",
  country: "India",
  /** Public on every invoice; can be overridden with COMPANY_GSTIN. */
  gstin: "09AALCN4402B1ZS",
  contactEmail: "sagar@noonscope.com",
  grievanceOfficer: { name: "Sagar Agarwal", email: "sagar@noonscope.com" },
  logoPath: "/brand/noonscope-logo.png",
} as const;

export type GstConfig = {
  gstin: string;
  /** Services Accounting Code printed on invoices. Confirm with your CA. */
  sac: string;
  /** Prefix before the financial year and serial, e.g. "LTR" → LTR/2026-27/0001. */
  invoicePrefix: string;
};

/** GST settings for invoices, or null when invoicing is switched off. */
export function getGstConfig(env: Record<string, string | undefined> = process.env): GstConfig | null {
  const raw = env.COMPANY_GSTIN?.trim().toUpperCase();
  if (raw === "OFF") return null;
  const gstin = raw || COMPANY.gstin;
  return {
    gstin,
    sac: env.COMPANY_SAC?.trim() || "998314",
    invoicePrefix: env.INVOICE_PREFIX?.trim() || "LTR",
  };
}

export const companyAddressOneLine = () => [COMPANY.legalName, ...COMPANY.addressLines].join(", ");
