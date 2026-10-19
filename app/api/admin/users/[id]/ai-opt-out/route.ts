import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { getUserById, setAiImprovementOptOut, logAdminAction } from "@/lib/db";

const Schema = z.object({ optOut: z.boolean() });

/** Honours an opt-out request sent to support: stop keeping AI examples and delete the kept ones. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await setAiImprovementOptOut(id, parsed.data.optOut);
  await logAdminAction({
    adminUserId: admin.id,
    action: parsed.data.optOut ? "ai_examples_opt_out" : "ai_examples_opt_in",
    targetUserId: id,
    detail: target.email,
  });
  return NextResponse.json({ ok: true });
}
