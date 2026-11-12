import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { REGION_PRICES } from "@/lib/plans";
import {
  AUTO_RENEW_GRACE_DAYS,
  autoRenewProUntil,
  razorpayPeriod,
  RENEWAL_PERIOD,
  renewingAmountMinor,
  renewingDescription,
  renewingPlanKey,
} from "@/lib/pro-pass";
import { subscriptionsEnabled, verifySubscriptionSignature } from "@/lib/razorpay";
import { formatMinor } from "@/lib/pro-payments";

describe("renewing Pro plans", () => {
  it("renew at the same prices as the plans, in every region including India", () => {
    for (const k of Object.keys(REGION_PRICES)) {
      const p = REGION_PRICES[k];
      expect(renewingAmountMinor(p, "monthly"), k).toBe(p.monthly * 100);
      expect(renewingAmountMinor(p, "quarter"), k).toBe(p.quarter * 100);
      expect(renewingAmountMinor(p, "yearly"), k).toBe(p.yearly * 100);
    }
    expect(renewingAmountMinor(REGION_PRICES.IN, "monthly")).toBe(59900);
  });

  it("map to the right Razorpay periods", () => {
    expect(razorpayPeriod("monthly")).toEqual({ period: "monthly", interval: 1 });
    expect(razorpayPeriod("quarter")).toEqual({ period: "monthly", interval: 3 });
    expect(razorpayPeriod("yearly")).toEqual({ period: "yearly", interval: 1 });
    expect(RENEWAL_PERIOD.quarter).toBe("every 3 months");
    expect(renewingDescription("yearly")).toBe("Lettr Pro - yearly, renews automatically");
  });

  it("stay off until switched on", () => {
    expect(subscriptionsEnabled({})).toBe(false);
    expect(subscriptionsEnabled({ RAZORPAY_SUBSCRIPTIONS: "on" })).toBe(true);
    expect(subscriptionsEnabled({ RAZORPAY_SUBSCRIPTIONS: "off" })).toBe(false);
  });

  it("keep Pro a few days past the paid period so retries don't switch it off", () => {
    const end = Date.UTC(2027, 0, 15) / 1000;
    expect(autoRenewProUntil(end).getTime()).toBe(end * 1000 + AUTO_RENEW_GRACE_DAYS * 86_400_000);
    const now = new Date(Date.UTC(2027, 0, 10));
    expect(autoRenewProUntil(null, 3, now).getUTCMonth()).toBe(3); // about 3 months later, plus grace
  });

  it("check the checkout signature", () => {
    const secret = "test_secret";
    const signature = createHmac("sha256", secret).update("pay_1|sub_1").digest("hex");
    expect(verifySubscriptionSignature({ subscriptionId: "sub_1", paymentId: "pay_1", signature, secret })).toBe(true);
    expect(verifySubscriptionSignature({ subscriptionId: "sub_2", paymentId: "pay_1", signature, secret })).toBe(false);
    expect(verifySubscriptionSignature({ subscriptionId: "sub_1", paymentId: "pay_1", signature: "", secret })).toBe(false);
  });

  it("name plans and format amounts", () => {
    expect(renewingPlanKey("quarter", "usd", 4900)).toBe("quarter_USD_4900");
    expect(formatMinor(2400, "USD")).toBe("$24");
    expect(formatMinor(59900, "INR")).toBe("₹599");
  });
});
