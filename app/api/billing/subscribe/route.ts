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
import {
  formatProDate,
  hasPaidPro,
  isPlanId,
  razorpayPeriod,
  renewingAmountMinor,
  renewingDescription,
  renewingPlanKey,
} from "@/lib/pro-pass";
import { createRazorpayPlan, createSubscription, currencyAllowed, razorpayConfigured, subscriptionsEnabled } from "@/lib/razorpay";

/** Most charges Razorpay is told to take before the subscription ends on its own (about 5 years). */
const TOTAL_COUNT = { monthly: 60, quarter: 20, yearly: 5 } as const;

/**
 * Starts an auto-renewing Pro plan (monthly, every 3 months or yearly): makes
 * a Razorpay subscription at this person's regional price and returns what
 * Razorpay Checkout needs. The price always comes from the server.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in to buy Pro." }, { status: 401 });
  if (!subscriptionsEnabled() || !razorpayConfigured()) {
    return NextResponse.json({ error: "Payments are temporarily unavailable. Please try again soon." }, { status: 503 });
  }

  const body = await req.json().catch(() => ({}));
  const plan: unknown = body?.plan;
  if (!isPlanId(plan)) return NextResponse.json({ error: "Pick a plan." }, { status: 400 });

  const userId = (session.user as { id: string }).id;
  const found = await getUserById(userId);
  if (!found) return NextResponse.json({ error: "User not found" }, { status: 404 });
  const user = await ensureUserRegion(found, req.headers);

  if (user.plan === "pro" && !user.pro_until) {
    return NextResponse.json({ error: "You already have Pro from the Lettr team." }, { status: 400 });
  }
  const running = await getActiveSubscriptionForUser(user.id);
  if (running && !running.cancel_at_cycle_end) {
    return NextResponse.json({ error: "You're already on a Pro plan." }, { status: 400 });
  }
  // Pro time someone already paid for (a one-time pass, or a cancelled plan
  // still running) is left alone; they can pick a plan once it ends.
  if (hasPaidPro(user) && user.pro_until && new Date(user.pro_until).getTime() > Date.now()) {
    return NextResponse.json(
      { error: `You have Pro until ${formatProDate(user.pro_until)}. You can pick a plan after that.` },
      { status: 400 }
    );
  }

  const prices = getRegionPrices(user.country_code, user.pricing_tier);
  if (!currencyAllowed(prices.currency)) {
    return NextResponse.json({ error: "Pro can't be bought from your country yet." }, { status: 403 });
  }
  const amount = renewingAmountMinor(prices, plan);

  try {
    const key = renewingPlanKey(plan, prices.currency, amount);
    let razorpayPlanId = await getRazorpayPlanId(key);
    if (!razorpayPlanId) {
      const created = await createRazorpayPlan({
        name: renewingDescription(plan),
        amount,
        currency: prices.currency,
        ...razorpayPeriod(plan),
      });
      razorpayPlanId = await saveRazorpayPlanId(key, created.id);
    }
    const sub = await createSubscription({
      planId: razorpayPlanId,
      totalCount: TOTAL_COUNT[plan],
      notes: { userId: user.id, plan },
    });
    await createProSubscription({ id: sub.id, userId: user.id, plan, razorpayPlanId, amount, currency: prices.currency });
    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      subscriptionId: sub.id,
      amount,
      currency: prices.currency,
      description: renewingDescription(plan),
      name: user.name ?? "",
      email: user.email,
    });
  } catch (err) {
    console.error("Subscription checkout failed", err);
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again, or contact support if it keeps happening." },
      { status: 502 }
    );
  }
}
