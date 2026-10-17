import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPaymentRecord, getUserById } from "@/lib/db";
import { ensureUserRegion } from "@/lib/user-region";
import { getRegionPrices } from "@/lib/plans";
import { isPlanId, passAmountMinor, passDescription, PRO_PASSES } from "@/lib/pro-pass";
import { createOrder, currencyAllowed, razorpayConfigured } from "@/lib/razorpay";

/**
 * Starts buying a Pro pass: makes a Razorpay order for the price shown to
 * this person on the pricing page and returns what Razorpay Checkout needs.
 * The price always comes from the server, never from the browser.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in to buy Pro." }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const plan: unknown = body?.plan;
  if (!isPlanId(plan)) return NextResponse.json({ error: "Pick a plan." }, { status: 400 });

  const userId = (session.user as { id: string }).id;
  const found = await getUserById(userId);
  if (!found) return NextResponse.json({ error: "User not found" }, { status: 404 });
  // Charge the price for their region, detecting it now if it was never saved.
  const user = await ensureUserRegion(found, req.headers);

  if (user.plan === "pro" && !user.pro_until) {
    return NextResponse.json({ error: "You already have Pro from the Lettr team." }, { status: 400 });
  }
  if (!razorpayConfigured()) {
    console.error("Checkout attempted but Razorpay keys are not set");
    return NextResponse.json(
      { error: "Payments are temporarily unavailable. Please try again soon or contact support." },
      { status: 503 }
    );
  }

  const prices = getRegionPrices(user.country_code, user.pricing_tier);
  if (!currencyAllowed(prices.currency)) {
    return NextResponse.json(
      { error: "Pro can only be bought from India for now. Payments from your country open soon." },
      { status: 403 }
    );
  }

  const amount = passAmountMinor(prices, plan);
  try {
    const order = await createOrder({
      amount,
      currency: prices.currency,
      receipt: `lettr_${plan}_${Date.now()}`,
      notes: { userId: user.id, plan },
    });
    await createPaymentRecord({
      orderId: order.id,
      userId: user.id,
      planId: plan,
      months: PRO_PASSES[plan].months,
      amount: order.amount,
      currency: order.currency,
    });
    return NextResponse.json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      description: passDescription(plan),
      name: user.name ?? "",
      email: user.email,
    });
  } catch (err) {
    console.error("Checkout failed", err);
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again, or contact support if it keeps happening." },
      { status: 502 }
    );
  }
}
