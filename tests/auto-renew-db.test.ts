import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import pool, {
  createProSubscription,
  createUser,
  getActiveSubscriptionForUser,
  getUserById,
  listProEndingSoon,
  listSubscriptionsRenewingSoon,
  markSubscriptionCancelling,
  recordSubscriptionCharge,
} from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

async function subscribedUser() {
  const id = randomUUID();
  await createUser({ id, email: `ar-${id}@example.com`, passwordHash: "x", countryCode: "US", pricingTier: "full" });
  const subId = `sub_${id.slice(0, 8)}`;
  await createProSubscription({ id: subId, userId: id, planId: "plan_test", amount: 1900, currency: "USD" });
  return { id, subId };
}

const days = (n: number) => new Date(Date.now() + n * 86_400_000);

describe("auto-renew charges", () => {
  it("switches Pro on once per charge, even when checkout and webhook both report it", async () => {
    const { id, subId } = await subscribedUser();
    const charge = { subscriptionId: subId, paymentId: `pay_${randomUUID()}`, amount: 1900, currency: "USD", currentEnd: days(30), proUntil: days(33) };
    const first = await recordSubscriptionCharge(charge);
    expect(first?.first).toBe(true);
    expect(await recordSubscriptionCharge(charge)).toBeNull();

    const user = await getUserById(id);
    expect(user?.plan).toBe("pro");
    expect(user?.pro_plan).toBe("auto_monthly");
    expect(Math.abs(new Date(user!.pro_until!).getTime() - days(33).getTime())).toBeLessThan(5000);
    expect((await getActiveSubscriptionForUser(id))?.id).toBe(subId);
  });

  it("moves Pro forward on renewal and marks it as not the first month", async () => {
    const { id, subId } = await subscribedUser();
    await recordSubscriptionCharge({ subscriptionId: subId, paymentId: `pay_${randomUUID()}`, amount: 1900, currency: "USD", currentEnd: days(1), proUntil: days(4) });
    const renewal = await recordSubscriptionCharge({ subscriptionId: subId, paymentId: `pay_${randomUUID()}`, amount: 1900, currency: "USD", currentEnd: days(31), proUntil: days(34) });
    expect(renewal?.first).toBe(false);
    const user = await getUserById(id);
    expect(new Date(user!.pro_until!).getTime()).toBeGreaterThan(days(33).getTime());
  });

  it("sends a renewal reminder instead of the 'Pro ends' email, until auto-renew is cancelled", async () => {
    const { id, subId } = await subscribedUser();
    await recordSubscriptionCharge({ subscriptionId: subId, paymentId: `pay_${randomUUID()}`, amount: 1900, currency: "USD", currentEnd: days(2), proUntil: days(2.5) });
    expect((await listSubscriptionsRenewingSoon(3)).some((s) => s.id === subId)).toBe(true);
    expect((await listProEndingSoon(3)).some((u) => u.id === id)).toBe(false);

    await markSubscriptionCancelling(subId);
    expect((await listSubscriptionsRenewingSoon(3)).some((s) => s.id === subId)).toBe(false);
    expect((await listProEndingSoon(3)).some((u) => u.id === id)).toBe(true);
  });
});
