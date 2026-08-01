import { describe, it, expect } from "vitest";
import { getTierForCountry, getDisplayPriceForCountry, getCountryFromHeaders, PRICING_TIERS, INDIA_DISPLAY_PRICE } from "@/lib/pricing-region";

describe("getTierForCountry", () => {
  it("classifies high-income countries as full tier", () => {
    expect(getTierForCountry("US")).toBe("full");
    expect(getTierForCountry("GB")).toBe("full");
    expect(getTierForCountry("DE")).toBe("full");
    expect(getTierForCountry("JP")).toBe("full");
  });

  it("classifies upper-middle-income countries as mid tier", () => {
    expect(getTierForCountry("BR")).toBe("mid");
    expect(getTierForCountry("MX")).toBe("mid");
    expect(getTierForCountry("CN")).toBe("mid");
  });

  it("classifies lower-middle-income countries as value tier", () => {
    expect(getTierForCountry("IN")).toBe("value");
    expect(getTierForCountry("PH")).toBe("value");
    expect(getTierForCountry("NG")).toBe("value");
  });

  it("is case-insensitive", () => {
    expect(getTierForCountry("in")).toBe("value");
    expect(getTierForCountry("br")).toBe("mid");
  });

  it("defaults unmapped/unknown countries to full tier - never silently under-charge an unreviewed country", () => {
    expect(getTierForCountry("XX")).toBe("full");
    expect(getTierForCountry(null)).toBe("full");
    expect(getTierForCountry(undefined)).toBe("full");
    expect(getTierForCountry("")).toBe("full");
  });
});

describe("getDisplayPriceForCountry", () => {
  it("shows India specifically in INR, not the generic value-tier USD price", () => {
    const result = getDisplayPriceForCountry("IN");
    expect(result.tier).toBe("value");
    expect(result.display).toBe(INDIA_DISPLAY_PRICE);
  });

  it("shows other value-tier countries in USD", () => {
    const result = getDisplayPriceForCountry("PH");
    expect(result.tier).toBe("value");
    expect(result.display).toBe(PRICING_TIERS.value.displayPrice);
  });

  it("shows full-tier countries at the standard price", () => {
    const result = getDisplayPriceForCountry("US");
    expect(result.tier).toBe("full");
    expect(result.display).toBe("$19");
  });
});

describe("getCountryFromHeaders", () => {
  it("reads the Vercel geolocation header when present", () => {
    const headers = new Headers({ "x-vercel-ip-country": "IN" });
    expect(getCountryFromHeaders(headers)).toBe("IN");
  });

  it("returns null when absent (local dev / non-Vercel hosts)", () => {
    const headers = new Headers();
    expect(getCountryFromHeaders(headers)).toBeNull();
  });
});
