/**
 * GST maths for Lettr invoices. Pure functions (no database) so they can be
 * unit tested. Amounts are whole paise/cents (integers) to avoid rounding drift.
 *
 * Rules used (confirm with your CA before launch):
 * - Indian prices are GST-inclusive at 18%: taxable = total / 1.18.
 * - Buyer in the same state as the seller (Uttar Pradesh): CGST 9% + SGST 9%.
 * - Buyer elsewhere in India, or state unknown for a business buyer: IGST 18%.
 *   For consumers with no state on record we use the "place of supply = seller's
 *   state" fallback, i.e. CGST + SGST.
 * - Buyer outside India: export of services, zero-rated (needs a filed LUT).
 */

export const GST_RATE = 0.18;

export type TaxType = "intra" | "inter" | "export";

export type GstBreakdown = {
  type: TaxType;
  total: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
};

/** Indian financial year label for a date, e.g. 15 Oct 2026 → "2026-27", 10 Feb 2027 → "2026-27". */
export function financialYear(date: Date): string {
  // Use India time so a payment at 1am IST on 1 April lands in the new year.
  const ist = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);
  const y = ist.getUTCFullYear();
  const start = ist.getUTCMonth() >= 3 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** e.g. ("LTR", "2026-27", 7) → "LTR/2026-27/0007". GST allows up to 16 characters. */
export function formatInvoiceNumber(prefix: string, fy: string, serial: number): string {
  const n = `${prefix}/${fy}/${String(serial).padStart(4, "0")}`;
  if (n.length > 16) throw new Error(`Invoice number "${n}" is longer than the 16 characters GST allows`);
  return n;
}

/** Splits a GST-inclusive total (in paise) into taxable value and tax heads. */
export function computeGst(input: {
  total: number;
  sellerStateCode: string;
  buyerCountry: string | null | undefined;
  buyerStateCode?: string | null;
}): GstBreakdown {
  const total = Math.round(input.total);
  const country = (input.buyerCountry || "IN").toUpperCase();
  if (country !== "IN") {
    return { type: "export", total, taxable: total, cgst: 0, sgst: 0, igst: 0 };
  }
  const taxable = Math.round(total / (1 + GST_RATE));
  const tax = total - taxable;
  const buyerState = input.buyerStateCode || input.sellerStateCode;
  if (buyerState === input.sellerStateCode) {
    const cgst = Math.floor(tax / 2);
    return { type: "intra", total, taxable, cgst, sgst: tax - cgst, igst: 0 };
  }
  return { type: "inter", total, taxable, cgst: 0, sgst: 0, igst: tax };
}

const GSTIN_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/** Checks a GSTIN's format and its check digit. Returns the cleaned GSTIN, or null if invalid. */
export function validateGstin(raw: string | null | undefined): string | null {
  const g = (raw || "").replace(/\s+/g, "").toUpperCase();
  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(g)) return null;
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const v = GSTIN_CHARS.indexOf(g[i]) * (i % 2 === 0 ? 1 : 2);
    sum += Math.floor(v / 36) + (v % 36);
  }
  const check = GSTIN_CHARS[(36 - (sum % 36)) % 36];
  return check === g[14] ? g : null;
}

/** The state code is the first two digits of a GSTIN. */
export const stateCodeFromGstin = (gstin: string) => gstin.slice(0, 2);

const ONES = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const TENS = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}
function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  return [h ? `${ONES[h]} Hundred` : "", rest ? twoDigits(rest) : ""].filter(Boolean).join(" ");
}

/** Whole rupees in Indian words, e.g. 1499 → "One Thousand Four Hundred Ninety Nine". */
export function rupeesInWords(rupees: number): string {
  let n = Math.floor(rupees);
  if (n === 0) return "Zero";
  const parts: string[] = [];
  const crore = Math.floor(n / 1e7); n %= 1e7;
  const lakh = Math.floor(n / 1e5); n %= 1e5;
  const thousand = Math.floor(n / 1e3); n %= 1e3;
  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (n) parts.push(threeDigits(n));
  return parts.join(" ");
}

/** "₹1,499.00" style for INR, "$49.00" otherwise. Amount in paise/cents. */
export function formatMoney(amount: number, currency: string): string {
  const value = amount / 100;
  const cur = currency.toUpperCase();
  return new Intl.NumberFormat(cur === "INR" ? "en-IN" : "en-US", { style: "currency", currency: cur }).format(value);
}

/** GST state codes → names, for printing the place of supply. */
export const GST_STATES: Record<string, string> = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh", "05": "Uttarakhand",
  "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh", "10": "Bihar", "11": "Sikkim",
  "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur", "15": "Mizoram", "16": "Tripura", "17": "Meghalaya",
  "18": "Assam", "19": "West Bengal", "20": "Jharkhand", "21": "Odisha", "22": "Chhattisgarh", "23": "Madhya Pradesh",
  "24": "Gujarat", "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra", "29": "Karnataka", "30": "Goa",
  "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry", "35": "Andaman and Nicobar Islands",
  "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh",
};
