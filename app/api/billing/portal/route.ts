import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { createBillingPortalSession } from "@/lib/stripe";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await getUserById(userId);
  if (!user?.stripe_customer_id) {
    // Pro given by an admin has no Stripe customer - nothing to manage or cancel.
    return NextResponse.json(
      {
        error:
          user?.plan === "pro"
            ? "Your Pro access was added by the Lettr team, so there's no payment to manage."
            : "You don't have a subscription yet.",
      },
      { status: 400 }
    );
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Billing is temporarily unavailable. Please try again later." }, { status: 503 });
  }

  try {
    const url = await createBillingPortalSession(user.stripe_customer_id);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to open billing portal";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
