import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { createReview, logActivity } from "@/lib/db";
import { analyzeReview } from "@/lib/ai";
import { sendReviewReplyEmail } from "@/lib/email";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  rating: z.number().int().min(1).max(5),
  content: z.string().min(10).max(3000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  const rateLimit = await checkAndRecordRateLimit(userId, "reviews", 5, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  let analysis;
  try {
    analysis = await analyzeReview(parsed.data.rating, parsed.data.content);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI analysis failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const id = randomUUID();
  await createReview({
    id,
    userId,
    rating: parsed.data.rating,
    content: parsed.data.content,
    sentiment: analysis.sentiment,
    likes: analysis.likes,
    dislikes: analysis.dislikes,
    aiReply: analysis.reply,
  });

  await logActivity(userId, "review_submitted", `${parsed.data.rating}★`);

  // Best-effort - the reply is already shown in the UI response either way,
  // so a failed/unconfigured email isn't a broken experience, just a missed
  // extra touchpoint.
  if (session.user.email) {
    await sendReviewReplyEmail(session.user.email, analysis.reply);
  }

  return NextResponse.json({ reply: analysis.reply }, { status: 201 });
}
