import { describe, it, expect } from "vitest";
import { MARKETS, marketFromCountry, marketGuidance, marketOf, parseMarket } from "@/lib/market";
import { analyzeAts } from "@/lib/ats-analyst";
import { buildCoverLetterPrompt } from "@/lib/ai";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import type { ResumeData } from "@/lib/types";

const withMarket = (market: "IN" | "US" | "UK" | "EU" | "GULF" | undefined, extra: Partial<ResumeData> = {}): ResumeData => ({
  ...SAMPLE_RESUME,
  ...extra,
  customization: { ...SAMPLE_RESUME.customization, market },
});
const check = (r: ResumeData, id: string) =>
  analyzeAts(r, "classic")
    .categories.flatMap((c) => c.checks)
    .find((c) => c.id === id);

describe("market", () => {
  it("only accepts known markets", () => {
    expect(parseMarket("US")).toBe("US");
    expect(parseMarket("MARS")).toBeUndefined();
    expect(marketOf({ market: "UK" })).toBe("UK");
    expect(marketOf(undefined)).toBeNull();
  });
  it("gives no guidance when unset and market notes when set", () => {
    expect(marketGuidance(null)).toBe("");
    expect(marketGuidance("US")).toContain("American spelling");
    expect(marketGuidance("UK")).toContain("CV");
  });
  it("US uses Letter, the others A4", () => {
    expect(MARKETS.US.pageSize).toBe("LETTER");
    expect(MARKETS.UK.pageSize).toBe("A4");
  });
  it("guesses a market from a country code", () => {
    expect(marketFromCountry("gb")).toBe("UK");
    expect(marketFromCountry("CA")).toBe("US");
    expect(marketFromCountry("DE")).toBe("EU");
    expect(marketFromCountry("AE")).toBe("GULF");
    expect(marketFromCountry("BR")).toBeUndefined();
  });
  it("cover letter prompt carries the market", () => {
    const p = buildCoverLetterPrompt({ resume: withMarket("UK"), jobDescription: "Analyst role" });
    expect(p).toContain("United Kingdom");
    expect(buildCoverLetterPrompt({ resume: withMarket(undefined), jobDescription: "x" })).not.toContain("Market:");
  });
  it("ATS photo advice follows the market", () => {
    const photo = { showPhoto: true, photoDataUrl: "data:image/png;base64,x" } as const;
    const r = (m: "IN" | "US" | undefined) => ({ ...withMarket(m), customization: { market: m, ...photo } });
    expect(check(r("US"), "photo")?.status).toBe("warn");
    expect(check(r("IN"), "photo")?.status).toBe("pass");
    expect(check(r(undefined), "photo")?.status).toBe("warn");
  });
  it("ATS flags personal details for US/UK but not India", () => {
    const r = (m: "IN" | "US") => withMarket(m, { summary: "Marketer. Marital status: single. Date of birth 1990." });
    expect(check(r("US"), "personal")?.status).toBe("warn");
    expect(check(r("IN"), "personal")).toBeUndefined();
  });
  it("phone tip no longer mentions Indian recruiters for UK", () => {
    const r = withMarket("UK", { contact: { fullName: "A", email: "a@b.co" } });
    expect(check(r, "phone")?.detail).not.toContain("Indian");
  });
});
