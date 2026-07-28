import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getUserById, deleteUserAccount, logAdminAction } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

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
