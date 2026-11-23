import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction, resolveProfileReport } from "@/lib/db";

export const runtime = "nodejs";

/** Dismisses one report (the profile is fine). Taking a profile down closes its reports itself. */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const ok = await resolveProfileReport(id, "dismissed", admin.id);
  if (!ok) return NextResponse.json({ error: "Report not found or already handled" }, { status: 404 });
  await logAdminAction({ adminUserId: admin.id, action: "profile_report_dismissed", detail: id });
  return NextResponse.json({ ok: true });
}
