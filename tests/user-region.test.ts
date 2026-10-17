import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import pool, { createUser, getUserById } from "@/lib/db";
import { ensureUserRegion } from "@/lib/user-region";
import { getDisplayPriceForUser } from "@/lib/pricing-region";

afterAll(async () => {
  await pool.end();
});

const headersFor = (country?: string) => new Headers(country ? { "x-vercel-ip-country": country } : {});

async function newUser(opts: { countryCode?: string; pricingTier?: string } = {}) {
  const id = randomUUID();
  await createUser({ id, email: `ur-${id}@example.com`, passwordHash: "x", ...opts });
  return (await getUserById(id))!;
}

describe("ensureUserRegion", () => {
  it("detects and saves the region for a user who has none (e.g. Google/LinkedIn signup)", async () => {
    const user = await newUser();
    const updated = await ensureUserRegion(user, headersFor("IN"));
    expect(updated.country_code).toBe("IN");
    expect(updated.pricing_tier).toBe("value");
    expect((await getUserById(user.id))?.pricing_tier).toBe("value");
  });

  it("never overwrites a region that was already saved", async () => {
    const user = await newUser({ countryCode: "US", pricingTier: "full" });
    const updated = await ensureUserRegion(user, headersFor("IN"));
    expect(updated.country_code).toBe("US");
    expect((await getUserById(user.id))?.pricing_tier).toBe("full");
  });

  it("leaves the user untouched when no country header is available (local dev)", async () => {
    const user = await newUser();
    const updated = await ensureUserRegion(user, headersFor());
    expect(updated.country_code).toBeNull();
  });
});

describe("getDisplayPriceForUser", () => {
  it("shows INR for India and the tier's USD price elsewhere", () => {
    expect(getDisplayPriceForUser({ country_code: "IN", pricing_tier: "value" }).display).toBe("₹399");
    expect(getDisplayPriceForUser({ country_code: "BR", pricing_tier: "mid" }).display).toBe("$9");
    expect(getDisplayPriceForUser({ country_code: "US", pricing_tier: "full" }).display).toBe("$19");
  });

  it("falls back to the country's tier if the saved tier is missing", () => {
    expect(getDisplayPriceForUser({ country_code: "ID", pricing_tier: null }).tier).toBe("value");
  });
});

describe("getAdminOverview", () => {
  it("separates paid from comped Pro and can leave the admin account out", async () => {
    const { getAdminOverview, updateUserPlan, createPaymentRecord, markPaymentPaid } = await import("@/lib/db");
    const before = await getAdminOverview(null);
    const paid = await newUser();
    const comped = await newUser();
    const orderId = `order_test_${paid.id}`;
    await createPaymentRecord({ orderId, userId: paid.id, planId: "quarter", months: 3, amount: 149900, currency: "INR" });
    await markPaymentPaid(orderId, `pay_test_${paid.id}`);
    await updateUserPlan({ userId: comped.id, plan: "pro" });
    const after = await getAdminOverview(null);
    expect(after.paidProUsers - before.paidProUsers).toBe(1);
    expect(after.compedProUsers - before.compedProUsers).toBe(1);
    const withoutComped = await getAdminOverview(comped.email);
    const latest = await getAdminOverview(null);
    // Other test files add users in parallel, so the total can grow between
    // these calls. Leaving one account out must still count one fewer than
    // the totals on either side.
    expect(withoutComped.totalUsers).toBeGreaterThanOrEqual(after.totalUsers - 1);
    expect(withoutComped.totalUsers).toBeLessThanOrEqual(latest.totalUsers - 1);
  });
});
