import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { countResumesForUser, lastReviewAtForUser } from "@/lib/db";
import { shouldPromptReview } from "@/lib/review-prompt";

// Whether to show the review pop-up to the signed-in user. Never errors
// loudly: if anything fails, the answer is just "no".
export async function GET() {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ show: false }, { headers: { "Cache-Control": "private, no-store" } });
  try {
    const [resumeCount, lastReviewAt] = await Promise.all([countResumesForUser(userId), lastReviewAtForUser(userId)]);
    return NextResponse.json({ show: shouldPromptReview({ resumeCount, lastReviewAt }) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ show: false }, { headers: { "Cache-Control": "private, no-store" } });
  }
}
