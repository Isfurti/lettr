import { describe, it, expect } from "vitest";
import { getGstConfig, lutArnFor, LUT_ARNS } from "@/lib/company";
import { PLACEHOLDER_SELLER } from "@/lib/invoices";

describe("export invoices and SAC", () => {
  it("uses SAC 998319 unless COMPANY_SAC overrides it", () => {
    expect(getGstConfig({}, PLACEHOLDER_SELLER)?.sac).toBe("998319");
    expect(getGstConfig({ COMPANY_SAC: "123456" }, PLACEHOLDER_SELLER)?.sac).toBe("123456");
  });

  it("finds the LUT ARN for the invoice's financial year", () => {
    expect(lutArnFor("2026-27")).toBe("AD0910260431486");
    expect(lutArnFor("2027-28")).toBeNull();
    expect(Object.keys(LUT_ARNS).every((fy) => /^\d{4}-\d{2}$/.test(fy))).toBe(true);
  });
});
