import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { createCheckoutSession } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  if (user.plan === "pro") {
    return NextResponse.json({ error: "Already on the Pro plan" }, { status: 400 });
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
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
