import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { getProfile, getUserById, logAdminAction, resolveOpenReportsForUser, setProfileDisabled } from "@/lib/db";

export const runtime = "nodejs";

const Schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("disable"), reason: z.string().trim().min(3).max(500) }),
  z.object({ action: z.literal("restore") }),
]);

/**
 * Takes a profile down (it stops showing at once and cannot be shared again) or restores it.
 * A restored profile stays private: the owner has to share it again themselves.
 */
export async function POST(req: Request, { params }: { params: Promise<{ userId: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { userId } = await params;
  const target = await getUserById(userId);
  const profile = target ? await getProfile(userId) : undefined;
  if (!target || !profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Give a reason of at least 3 characters." }, { status: 400 });

  if (parsed.data.action === "disable") {
    await setProfileDisabled(userId, parsed.data.reason);
    await resolveOpenReportsForUser(userId, admin.id);
    await logAdminAction({ adminUserId: admin.id, action: "profile_taken_down", targetUserId: userId, detail: `${target.email}: ${parsed.data.reason}` });
  } else {
    await setProfileDisabled(userId, null);
    await logAdminAction({ adminUserId: admin.id, action: "profile_restored", targetUserId: userId, detail: target.email });
  }
  return NextResponse.json({ ok: true });
}
