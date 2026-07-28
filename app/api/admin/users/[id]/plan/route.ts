import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { getUserById, updateUserPlan, logAdminAction } from "@/lib/db";

const Schema = z.object({ plan: z.enum(["free", "pro"]) });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const target = await getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  await updateUserPlan({ userId: id, plan: parsed.data.plan, stripeSubscriptionId: target.stripe_subscription_id });

  await logAdminAction({
    adminUserId: admin.id,
    action: "changed_plan",
    targetUserId: id,
    detail: `${target.email}: ${target.plan} → ${parsed.data.plan}`,
  });

  return NextResponse.json({ ok: true });
}
