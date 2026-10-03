import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe";
import { ensureUserRegion } from "@/lib/user-region";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const found = await getUserById(userId);
  if (!found) return NextResponse.json({ error: "User not found" }, { status: 404 });
  // Charge the price for their region, detecting it now if it was never saved.
  const user = await ensureUserRegion(found, req.headers);

  if (user.plan === "pro") {
    return NextResponse.json({ error: "Already on the Pro plan" }, { status: 400 });
  }

  // Payments not set up yet (no Stripe key in this environment) - say so
  // plainly instead of showing the raw configuration error to a customer.
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("Checkout attempted but STRIPE_SECRET_KEY is not set");
    return NextResponse.json(
      { error: "Upgrades are temporarily unavailable. Please try again soon or contact support." },
      { status: 503 }
    );
  }

  try {
    const url = await createCheckoutSession({
      userId: user.id,
      email: user.email,
      existingStripeCustomerId: user.stripe_customer_id,
      pricingTier: user.pricing_tier ?? "full",
    });
    return NextResponse.json({ url });
  } catch (err) {
    console.error("Checkout failed", err);
    return NextResponse.json(
      { error: "We couldn't start checkout. Please try again, or contact support if it keeps happening." },
      { status: 502 }
    );
  }
}
