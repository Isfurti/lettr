import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { getUserById, claimUnverifiedAccount, logAdminAction } from "@/lib/db";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // The admin cannot tell whether the person asking owns this email, and the
  // password on an unverified account may have been set by someone else. So
  // verifying also cancels that password and open sessions; the owner sets
  // a new one with "Forgot password" (sent to the mailbox itself).
  if (!target.email_verified) {
    await claimUnverifiedAccount(id, await bcrypt.hash(randomBytes(32).toString("hex"), 12));
  }

  await logAdminAction({
    adminUserId: admin.id,
    action: "marked_email_verified",
    targetUserId: id,
    detail: target.email,
  });

  return NextResponse.json({ ok: true });
}
