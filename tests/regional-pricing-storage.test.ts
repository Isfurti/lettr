import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

import { createUser, getUserById } from "@/lib/db";
import { getTierForCountry } from "@/lib/pricing-region";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("regional pricing storage on user records", () => {
  it("stores the detected country and tier at account creation", async () => {
    const id = randomUUID();
    const countryCode = "IN";
    const pricingTier = getTierForCountry(countryCode);

    await createUser({
      id,
      email: `region-${id}@example.com`,
      passwordHash: "x",
      countryCode,
      pricingTier,
    });

    const user = await getUserById(id);
    expect(user?.country_code).toBe("IN");
    expect(user?.pricing_tier).toBe("value");
  });

  it("stores null country/tier gracefully when none was detected (e.g. local dev, non-Vercel host)", async () => {
    const id = randomUUID();
    await createUser({ id, email: `noregion-${id}@example.com`, passwordHash: "x" });

    const user = await getUserById(id);
    expect(user?.country_code).toBeNull();
    expect(user?.pricing_tier).toBeNull();
  });

  it("a US signup is correctly stored as the full tier", async () => {
    const id = randomUUID();
    const pricingTier = getTierForCountry("US");
    await createUser({ id, email: `us-${id}@example.com`, passwordHash: "x", countryCode: "US", pricingTier });

    const user = await getUserById(id);
    expect(user?.pricing_tier).toBe("full");
  });
});
