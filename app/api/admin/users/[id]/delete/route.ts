import { NextResponse } from "next/server";
import { requireAdminApi, isAdminEmail } from "@/lib/admin-auth";
import { getUserById, deleteUserAccount, logAdminAction } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // Never let the admin delete their own account from here (they'd lock
  // themselves out). Pro passes don't renew, so nobody is charged afterwards.
  if (target.id === admin.id || isAdminEmail(target.email)) {
    return NextResponse.json({ error: "You can't delete your own admin account." }, { status: 400 });
  }

  // Log BEFORE deleting - the audit record needs to capture who this was,
  // since after deletion the user row (and their email) will be gone.
  await logAdminAction({
    adminUserId: admin.id,
    action: "deleted_account",
    targetUserId: id,
    detail: target.email,
  });

  await deleteUserAccount(id);

  return NextResponse.json({ ok: true });
}
