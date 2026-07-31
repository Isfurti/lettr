import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { setReviewFeatured, logAdminAction } from "@/lib/db";

const Schema = z.object({ featured: z.boolean() });

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const result = await setReviewFeatured(id, parsed.data.featured);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }

  await logAdminAction({
    adminUserId: admin.id,
    action: parsed.data.featured ? "featured_review" : "unfeatured_review",
    detail: id,
  });

  return NextResponse.json({ ok: true });
}
