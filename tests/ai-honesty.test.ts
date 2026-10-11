import { describe, it, expect } from "vitest";
import {
  blankInventedNumbers,
  guardRewrites,
  numbersIn,
  unsupportedClaim,
  yearsOfExperience,
} from "@/lib/ai-honesty";

describe("guardRewrites", () => {
  it("drops the made-up claims the old prompt produced for a plain duty", () => {
    // Real options Lettr returned for "Responsible for sales in Pune region." before this fix.
    const source = "Responsible for sales in Pune region.\nSales Executive";
    const { kept, dropped } = guardRewrites(source, [
      "Drove revenue growth across the Pune region by managing a diversified client portfolio and exceeding quarterly sales targets through strategic account development.",
      "Spearheaded regional sales operations in Pune, cultivating key business relationships and expanding market share within a competitive territory.",
      "Managed end-to-end sales cycle for the Pune region, from prospecting through contract closure, while building a sustainable pipeline of enterprise and mid-market accounts.",
    ]);
    expect(kept).toEqual([]);
    expect(dropped).toHaveLength(3);
  });

  it("keeps honest options that leave blanks for the person to fill in", () => {
    const source = "Responsible for sales in Pune region.\nSales Executive";
    const { kept } = guardRewrites(source, [
      "Grew sales in the Pune region by [X]% over [time period]",
      "Sold to [number] clients across the Pune region",
      "Handled sales for the Pune region",
    ]);
    expect(kept).toHaveLength(3);
  });

  it("turns numbers the person never gave into blanks, and keeps theirs", () => {
    const source = "Ran 4 webinars a quarter";
    const { kept } = guardRewrites(source, ["Ran 4 webinars a quarter, adding 600 sign-ups and lifting open rates 30%"]);
    expect(kept[0]).toBe("Ran 4 webinars a quarter, adding [X] sign-ups and lifting open rates [X]%");
  });

  it("allows claims the person made themselves", () => {
    const source = "Exceeded my monthly sales target 6 times in 2025";
    const { kept } = guardRewrites(source, ["Exceeded monthly sales target 6 times in 2025"]);
    expect(kept).toEqual(["Exceeded monthly sales target 6 times in 2025"]);
  });

  it("allows years of experience worked out from the dates", () => {
    const { kept } = guardRewrites("Sales Executive at ABC (Jun 2021–Present)", ["Sales executive with 5 years in B2B sales"], [5]);
    expect(kept[0]).toBe("Sales executive with 5 years in B2B sales");
  });

  it("removes duplicates and empty options", () => {
    const { kept } = guardRewrites("Handled clients", ["Handled [number] clients", " handled [number] clients ", ""]);
    expect(kept).toEqual(["Handled [number] clients"]);
  });
});

describe("blankInventedNumbers", () => {
  it("handles money, percentages, commas and multipliers", () => {
    const allowed = numbersIn("Managed a ₹2 Cr budget");
    expect(blankInventedNumbers("Managed a ₹2 Cr budget, cutting costs 15% and serving 1,200 customers 3x faster", allowed)).toBe(
      "Managed a ₹2 Cr budget, cutting costs [X]% and serving [X] customers [X]x faster"
    );
  });

  it("leaves words with digits alone (B2B, Q2, EC2) and keeps punctuation", () => {
    expect(blankInventedNumbers("Closed B2B deals in Q2 on EC2, adding 40 accounts, fast", new Set())).toBe(
      "Closed B2B deals in Q2 on EC2, adding [X] accounts, fast"
    );
  });

  it("never touches existing blanks", () => {
    expect(blankInventedNumbers("Grew revenue [X]% to ₹[2.1 Cr]", new Set())).toBe("Grew revenue [X]% to ₹[2.1 Cr]");
  });

  it("matches numbers written with or without commas", () => {
    expect(blankInventedNumbers("Reached 1200 users", numbersIn("reached 1,200 users"))).toBe("Reached 1200 users");
  });
});

describe("unsupportedClaim", () => {
  it("needs a blank or a real number for results", () => {
    expect(unsupportedClaim("Improved client retention", "Handled clients")).toBe("result-without-blank");
    expect(unsupportedClaim("Improved client retention by [X]%", "Handled clients")).toBeNull();
    expect(unsupportedClaim("Improved client retention by 20%", "Kept 20% more clients than last year")).toBeNull();
  });

  it("flags awards, promotions and market share the person never mentioned", () => {
    expect(unsupportedClaim("Won the top performer award", "Handled clients")).toBe("recognition");
    expect(unsupportedClaim("Promoted within a year", "Handled clients")).toBe("promotion");
    expect(unsupportedClaim("Expanded market share in Pune", "Sold in Pune")).toBe("market-share");
  });
});

describe("yearsOfExperience", () => {
  const now = new Date("2026-10-12T00:00:00Z");

  it("counts from the earliest start to the latest end", () => {
    expect(
      yearsOfExperience(
        [
          { startDate: "Jun 2021", endDate: "Present" },
          { startDate: "2018", endDate: "May 2021" },
        ],
        now
      )
    ).toBe(8);
  });

  it("returns null when dates are missing or under a year", () => {
    expect(yearsOfExperience([{ startDate: "", endDate: "" }], now)).toBeNull();
    expect(yearsOfExperience([{ startDate: "Jan 2026", endDate: "Present" }], now)).toBeNull();
  });
});
