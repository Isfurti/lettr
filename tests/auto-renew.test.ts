import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { REGION_PRICES } from "@/lib/plans";
import { autoRenewAmountMinor, autoRenewPlanKey, autoRenewProUntil, AUTO_RENEW_GRACE_DAYS } from "@/lib/pro-pass";
import { subscriptionsEnabled, verifySubscriptionSignature } from "@/lib/razorpay";
import { formatMinor } from "@/lib/pro-payments";

describe("auto-renewing monthly Pro", () => {
  it("is offered outside India only, a little below the one-time month", () => {
    expect(autoRenewAmountMinor(REGION_PRICES.IN)).toBeNull();
    for (const k of ["US", "GB", "EU", "AU", "MID", "VALUE"]) {
      const p = REGION_PRICES[k];
      expect(p.autoMonthly, k).toBeGreaterThan(0);
      expect(p.autoMonthly!, k).toBeLessThan(p.monthly);
      expect(autoRenewAmountMinor(p)).toBe(p.autoMonthly! * 100);
    }
  });

  it("stays hidden until switched on", () => {
    expect(subscriptionsEnabled({})).toBe(false);
    expect(subscriptionsEnabled({ RAZORPAY_SUBSCRIPTIONS: "on" })).toBe(true);
    expect(subscriptionsEnabled({ RAZORPAY_SUBSCRIPTIONS: "off" })).toBe(false);
  });

  it("keeps Pro a few days past the paid month so retries don't switch it off", () => {
    const end = Date.UTC(2027, 0, 15) / 1000;
    expect(autoRenewProUntil(end).getTime()).toBe(end * 1000 + AUTO_RENEW_GRACE_DAYS * 86_400_000);
    const now = new Date(Date.UTC(2027, 0, 31));
    const fallback = autoRenewProUntil(null, now);
    expect(fallback.getUTCMonth()).toBe(2); // about a month later, plus grace
  });

  it("checks the checkout signature for subscriptions", () => {
    const secret = "test_secret";
    const signature = createHmac("sha256", secret).update("pay_1|sub_1").digest("hex");
    expect(verifySubscriptionSignature({ subscriptionId: "sub_1", paymentId: "pay_1", signature, secret })).toBe(true);
    expect(verifySubscriptionSignature({ subscriptionId: "sub_2", paymentId: "pay_1", signature, secret })).toBe(false);
    expect(verifySubscriptionSignature({ subscriptionId: "sub_1", paymentId: "pay_1", signature: "", secret })).toBe(false);
  });

  it("names plans and formats amounts", () => {
    expect(autoRenewPlanKey("usd", 1900)).toBe("USD_1900");
    expect(formatMinor(1900, "USD")).toBe("$19");
    expect(formatMinor(1550, "GBP")).toBe("£15.50");
  });
});
