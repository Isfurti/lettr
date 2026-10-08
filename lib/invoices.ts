import { getGstConfig, SELLER, type Seller } from "./company";
import { computeGst, financialYear, formatInvoiceNumber, stateCodeFromGstin, validateGstin } from "./gst";
import { createInvoiceRecord, type InvoiceRow } from "./db";

export type IssueInvoiceInput = {
  userId: string | null;
  buyerName: string | null;
  buyerEmail: string;
  /** Optional business GSTIN entered at checkout. Invalid values are ignored. */
  buyerGstin?: string | null;
  /** Two-digit GST state code if known (taken from the GSTIN when there is one). */
  buyerStateCode?: string | null;
  /** ISO country code of the buyer, e.g. "IN". */
  buyerCountry: string;
  /** What was bought, e.g. "Lettr Pro - 3-month pass". */
  description: string;
  currency: string;
  /** Amount paid including GST, in paise/cents. */
  total: number;
  /** The payment provider's id for this payment, so a repeated webhook can't create a second invoice. */
  paymentRef: string;
  issuedAt?: Date;
};

/**
 * Creates the GST invoice for a successful payment. Returns null when
 * invoicing is switched off (COMPANY_GSTIN=off). Call it from the payment
 * provider's "payment succeeded" webhook.
 */
export async function issueGstInvoice(input: IssueInvoiceInput, seller: Seller | null = SELLER): Promise<InvoiceRow | null> {
  const config = getGstConfig(process.env, seller);
  if (!config || !seller) return null;
  const issuedAt = input.issuedAt ?? new Date();
  const buyerGstin = validateGstin(input.buyerGstin);
  const country = (input.buyerCountry || "IN").toUpperCase();
  const buyerStateCode = buyerGstin ? stateCodeFromGstin(buyerGstin) : input.buyerStateCode || null;
  const gst = computeGst({
    total: input.total,
    sellerStateCode: seller.stateCode,
    buyerCountry: country,
    buyerStateCode,
  });
  return createInvoiceRecord(
    {
      financial_year: financialYear(issuedAt),
      issuedAt,
      user_id: input.userId,
      buyer_name: input.buyerName,
      buyer_email: input.buyerEmail,
      buyer_gstin: buyerGstin,
      buyer_state_code: buyerStateCode,
      buyer_country: country,
      description: input.description,
      sac: config.sac,
      seller_gstin: config.gstin,
      currency: input.currency.toUpperCase(),
      total: gst.total,
      taxable: gst.taxable,
      cgst: gst.cgst,
      sgst: gst.sgst,
      igst: gst.igst,
      tax_type: gst.type,
      payment_ref: input.paymentRef,
    },
    (fy, serial) => formatInvoiceNumber(config.invoicePrefix, fy, serial)
  );
}

/** Stand-in company for the invoice preview while Lettr has no company of its own. */
export const PLACEHOLDER_SELLER: Seller = {
  legalName: "Your Company Pvt. Ltd.",
  addressLines: ["Registered office address", "City, State, India"],
  city: "City",
  state: "Uttar Pradesh",
  stateCode: "09",
  gstin: "09AAAAA0000A1Z5",
};

/** A made-up invoice for previewing the layout. Never saved. */
export function sampleInvoice(kind: "intra" | "inter" | "export" = "intra", seller: Seller = SELLER ?? PLACEHOLDER_SELLER): InvoiceRow {
  const config = getGstConfig(process.env, seller) ?? { gstin: seller.gstin, sac: "998314", invoicePrefix: "LTR" };
  const now = new Date();
  const fy = financialYear(now);
  const country = kind === "export" ? "US" : "IN";
  const state = kind === "inter" ? "27" : "09";
  const total = kind === "export" ? 4900 : 149900;
  const gst = computeGst({ total, sellerStateCode: seller.stateCode, buyerCountry: country, buyerStateCode: state });
  return {
    id: "sample",
    number: formatInvoiceNumber(config.invoicePrefix, fy, 1),
    financial_year: fy,
    serial: 1,
    user_id: null,
    issued_at: now.toISOString(),
    buyer_name: "Sample Customer",
    buyer_email: "customer@example.com",
    buyer_gstin: null,
    buyer_state_code: country === "IN" ? state : null,
    buyer_country: country,
    description: "Lettr Pro - 3-month pass",
    sac: config.sac,
    seller_gstin: config.gstin,
    currency: kind === "export" ? "USD" : "INR",
    total: gst.total,
    taxable: gst.taxable,
    cgst: gst.cgst,
    sgst: gst.sgst,
    igst: gst.igst,
    tax_type: gst.type,
    payment_ref: null,
  };
}
