import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/admin-auth";
import { approveReviewReply, getReviewWithEmail, logAdminAction } from "@/lib/db";
import { sendReviewReplyEmail } from "@/lib/email";

const Schema = z.object({ reply: z.string().trim().min(5).max(3000) });

/** Approve (and optionally edit) the reply to a 1-2 star review, then email it. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write a reply first." }, { status: 400 });
  const review = await getReviewWithEmail(id);
  if (!review) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const emailed = review.user_email ? (await sendReviewReplyEmail(review.user_email, parsed.data.reply)).sent : false;
  await approveReviewReply(id, parsed.data.reply, emailed);
  await logAdminAction({ adminUserId: admin.id, action: "approved_review_reply", detail: id });
  return NextResponse.json({ ok: true, emailed });
}
