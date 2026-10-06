import { describe, it, expect } from "vitest";
import { computeGst, financialYear, formatInvoiceNumber, validateGstin, rupeesInWords, formatMoney } from "@/lib/gst";
import { getGstConfig } from "@/lib/company";

describe("financial year", () => {
  it("runs April to March in India time", () => {
    expect(financialYear(new Date("2026-10-15T10:00:00Z"))).toBe("2026-27");
    expect(financialYear(new Date("2027-02-10T10:00:00Z"))).toBe("2026-27");
    expect(financialYear(new Date("2027-03-31T18:00:00Z"))).toBe("2026-27"); // 31 March 11:30pm IST
    expect(financialYear(new Date("2027-03-31T19:00:00Z"))).toBe("2027-28"); // 1 April 12:30am IST
    expect(financialYear(new Date("2027-03-31T18:00:00Z")).length).toBe(7);
  });
});

describe("invoice numbers", () => {
  it("pads the serial and stays within 16 characters", () => {
    expect(formatInvoiceNumber("LTR", "2026-27", 7)).toBe("LTR/2026-27/0007");
    expect(() => formatInvoiceNumber("LETTRPRO", "2026-27", 1)).toThrow();
  });
});

describe("GST split", () => {
  it("splits ₹699 inside Uttar Pradesh into CGST + SGST", () => {
    const g = computeGst({ total: 69900, sellerStateCode: "09", buyerCountry: "IN", buyerStateCode: "09" });
    expect(g.type).toBe("intra");
    expect(g.taxable).toBe(59237);
    expect(g.cgst + g.sgst).toBe(69900 - 59237);
    expect(g.igst).toBe(0);
  });
  it("uses IGST for another state", () => {
    const g = computeGst({ total: 149900, sellerStateCode: "09", buyerCountry: "IN", buyerStateCode: "27" });
    expect(g.type).toBe("inter");
    expect(g.igst).toBe(149900 - g.taxable);
    expect(g.cgst).toBe(0);
  });
  it("treats buyers outside India as zero-rated exports", () => {
    const g = computeGst({ total: 4900, sellerStateCode: "09", buyerCountry: "US" });
    expect(g).toMatchObject({ type: "export", taxable: 4900, cgst: 0, sgst: 0, igst: 0 });
  });
  it("always adds back up to the total", () => {
    for (const total of [69900, 149900, 399900, 1, 101]) {
      const g = computeGst({ total, sellerStateCode: "09", buyerCountry: "IN" });
      expect(g.taxable + g.cgst + g.sgst + g.igst).toBe(total);
    }
  });
});

describe("GSTIN check", () => {
  it("accepts a valid GSTIN and rejects a wrong check digit", () => {
    expect(validateGstin("27aapfu0939f1zv")).toBe("27AAPFU0939F1ZV");
    expect(validateGstin("27AAPFU0939F1ZA")).toBeNull();
    expect(validateGstin("not-a-gstin")).toBeNull();
  });
});

describe("amounts", () => {
  it("writes rupees in Indian words", () => {
    expect(rupeesInWords(699)).toBe("Six Hundred Ninety Nine");
    expect(rupeesInWords(1499)).toBe("One Thousand Four Hundred Ninety Nine");
    expect(rupeesInWords(250000)).toBe("Two Lakh Fifty Thousand");
  });
  it("formats money", () => {
    expect(formatMoney(149900, "INR")).toBe("₹1,499.00");
    expect(formatMoney(4900, "usd")).toBe("$49.00");
  });
});

describe("GST config", () => {
  it("uses Noonscope's GSTIN by default and can be switched off", () => {
    expect(getGstConfig({})).toMatchObject({ gstin: "09AALCN4402B1ZS", invoicePrefix: "LTR" });
    expect(validateGstin(getGstConfig({})!.gstin)).toBe("09AALCN4402B1ZS");
    expect(getGstConfig({ COMPANY_GSTIN: "off" })).toBeNull();
    expect(getGstConfig({ COMPANY_GSTIN: " 09abcde1234f1z5 " })).toMatchObject({ gstin: "09ABCDE1234F1Z5" });
  });
});
