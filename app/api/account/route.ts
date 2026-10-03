import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, deleteUserAccount } from "@/lib/db";

/**
 * Self-serve account deletion. Removes the user row; resumes and activity
 * cascade-delete with it (see deleteUserAccount in lib/db.ts).
 *
 * An active Pro subscription must be cancelled first - deleting the account
 * out from under a live Stripe subscription would keep charging them with
 * no way to log in and stop it.
 */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => ({}));
  if (body?.confirm !== "DELETE") {
    return NextResponse.json({ error: 'Type DELETE to confirm.' }, { status: 400 });
  }

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });

  if (user.plan === "pro" && user.stripe_subscription_id) {
    return NextResponse.json(
      {
        error:
          "Please cancel your Pro subscription first (Manage billing on your dashboard), then delete your account.",
        subscriptionActive: true,
      },
      { status: 409 }
    );
  }

  await deleteUserAccount(userId);
  return NextResponse.json({ ok: true });
}
