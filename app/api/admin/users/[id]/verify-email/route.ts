import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { getUserById, markEmailVerifiedByAdmin, logAdminAction } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  await markEmailVerifiedByAdmin(id);

  await logAdminAction({
    adminUserId: admin.id,
    action: "marked_email_verified",
    targetUserId: id,
    detail: target.email,
  });

  return NextResponse.json({ ok: true });
}
