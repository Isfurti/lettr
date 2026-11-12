import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  createProSubscription,
  getActiveSubscriptionForUser,
  getRazorpayPlanId,
  getUserById,
  saveRazorpayPlanId,
} from "@/lib/db";
import { ensureUserRegion } from "@/lib/user-region";
import { getRegionPrices } from "@/lib/plans";
import { AUTO_RENEW_DESCRIPTION, autoRenewAmountMinor, autoRenewPlanKey, formatProDate, hasPaidPro } from "@/lib/pro-pass";
import { createMonthlyPlan, createSubscription, currencyAllowed, razorpayConfigured, subscriptionsEnabled } from "@/lib/razorpay";

/**
 * Starts the auto-renewing monthly Pro plan (outside India, cards only):
 * makes a Razorpay subscription at this person's regional price and returns
 * what Razorpay Checkout needs. The price always comes from the server.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in to buy Pro." }, { status: 401 });
  if (!subscriptionsEnabled() || !razorpayConfigured()) {
    return NextResponse.json({ error: "Auto-renew isn't available yet. Please pick a one-time pass." }, { status: 503 });
  }

  const userId = (session.user as { id: string }).id;
  const found = await getUserById(userId);
  if (!found) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const user = await ensureUserRegion(found, req.headers);

  if (user.plan === "pro" && !user.pro_until) {
    return NextResponse.json({ error: "You already have Pro from the Lettr team." }, { status: 400 });
  }
  if (await getActiveSubscriptionForUser(user.id)) {
    return NextResponse.json({ error: "You're already on the auto-renewing plan." }, { status: 400 });
  }
  if (hasPaidPro(user) && user.pro_until && new Date(user.pro_until).getTime() > Date.now()) {
    return NextResponse.json(
      { error: `Your Pro pass runs until ${formatProDate(user.pro_until)}. You can switch to auto-renew after it ends.` },
      { status: 400 }
    );
  }

  const prices = getRegionPrices(user.country_code, user.pricing_tier);
  const amount = autoRenewAmountMinor(prices);
  if (amount === null || !currencyAllowed(prices.currency)) {
    return NextResponse.json({ error: "Auto-renew isn't offered in your country. Please pick a one-time pass." }, { status: 403 });
  }

  try {
    const key = autoRenewPlanKey(prices.currency, amount);
    let planId = await getRazorpayPlanId(key);
    if (!planId) {
      const plan = await createMonthlyPlan({ name: AUTO_RENEW_DESCRIPTION, amount, currency: prices.currency });
      planId = await saveRazorpayPlanId(key, plan.id);
    }
    const sub = await createSubscription({ planId, notes: { userId: user.id, plan: "auto_monthly" } });
    await createProSubscription({ id: sub.id, userId: user.id, planId, amount, currency: prices.currency });
    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: sub.id,
      amount,
      currency: prices.currency,
      description: AUTO_RENEW_DESCRIPTION,
      name: user.name ?? "",
      email: user.email,
    });
  } catch (err) {
    console.error("Subscription checkout failed", err);
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again, or pick a one-time pass." },
      { status: 502 }
    );
  }
}
