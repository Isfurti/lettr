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
    return NextResponse.json({ error: "No billing account found for this user" }, { status: 400 });
  }

  try {
    const url = await createBillingPortalSession(user.stripe_customer_id);
    return NextResponse.json({ url });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to open billing portal";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
