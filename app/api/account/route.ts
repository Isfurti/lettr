import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, deleteUserAccount } from "@/lib/db";

/**
 * Self-serve account deletion. Removes the user row; resumes and activity
 * cascade-delete with it (see deleteUserAccount in lib/db.ts). Pro passes don't renew, so
 * there's never a payment left running after the account is gone.
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

  await deleteUserAccount(userId);
  return NextResponse.json({ ok: true });
}
