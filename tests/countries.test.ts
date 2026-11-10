import { describe, it, expect } from "vitest";
import { COUNTRIES, getCountry } from "@/lib/countries";
import { getExample } from "@/lib/examples";

describe("country pages", () => {
  it("has unique slugs and complete content", () => {
    expect(new Set(COUNTRIES.map((c) => c.slug)).size).toBe(COUNTRIES.length);
    for (const c of COUNTRIES) {
      expect(c.tips.length).toBe(3);
      expect(c.locale).toMatch(/^en_[A-Z]{2}$/);
      for (const e of c.examples) expect(getExample(e), `${c.slug} -> ${e}`).toBeTruthy();
    }
  });
  it("never shows pricing and leaves Europe out", () => {
    for (const c of COUNTRIES) expect(JSON.stringify(c)).not.toMatch(/₹|\$\d|\bprice\b|per month/i);
    for (const s of ["ireland", "germany", "france"]) expect(getCountry(s)).toBeUndefined();
  });
});
