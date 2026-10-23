import { describe, it, expect } from "vitest";
import { pricesForViewer, REGION_PRICES } from "@/lib/plans";

describe("pricing page prices", () => {
  it("shows US prices to visitors who aren't signed in", () => {
    expect(pricesForViewer(null)).toEqual({ prices: REGION_PRICES.US, tier: "full" });
  });

  it("shows signed-in people their own country's prices", () => {
    expect(pricesForViewer({ country_code: "IN", pricing_tier: "value" }).prices.currency).toBe("INR");
    expect(pricesForViewer({ country_code: "GB", pricing_tier: "full" }).prices).toBe(REGION_PRICES.GB);
    expect(pricesForViewer({ country_code: "NG", pricing_tier: "value" })).toEqual({ prices: REGION_PRICES.VALUE, tier: "value" });
  });

  it("falls back to US prices when a signed-in person's country isn't known yet", () => {
    expect(pricesForViewer({ country_code: null, pricing_tier: null }).prices).toBe(REGION_PRICES.US);
  });
});

describe("all region prices for the admin", () => {
  it("lists every region once, USA first, India on its own row", async () => {
    const { allRegionPriceRows } = await import("@/lib/plans");
    const rows = allRegionPriceRows();
    expect(rows.map((r) => r.id).sort()).toEqual(Object.keys(REGION_PRICES).sort());
    expect(rows[0].prices).toBe(REGION_PRICES.US);
    expect(rows.find((r) => r.id === "VALUE")!.appliesTo).not.toContain("India");
    expect(rows.find((r) => r.id === "EU")!.appliesTo).toContain("Germany");
  });
});
