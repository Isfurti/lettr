import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin-auth";
import { logAdminAction, resolveProfileReport } from "@/lib/db";
import { isJsonRequest, isSameOriginRequest } from "@/lib/same-origin";

export const runtime = "nodejs";

/** Dismisses one report (the profile is fine). Taking a profile down closes its reports itself. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOriginRequest(req) || !isJsonRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const { id } = await params;
  const owner = await resolveProfileReport(id, "dismissed", admin.id);
  if (!owner) return NextResponse.json({ error: "Report not found or already handled" }, { status: 404 });
  await logAdminAction({ adminUserId: admin.id, action: "profile_report_dismissed", targetUserId: owner, detail: id });
  return NextResponse.json({ ok: true });
}
