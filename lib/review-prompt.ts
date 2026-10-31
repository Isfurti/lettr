/**
 * Who gets the "How's Lettr working for you?" pop-up: people who have
 * actually used the app (made at least one resume) and haven't left a
 * review recently. "Not now" is remembered on the device for a while.
 */
export const REVIEW_AGAIN_AFTER_DAYS = 90;
export const SNOOZE_DAYS = 14;
export const SNOOZE_KEY = "lettr_review_prompt_snooze_until";

export function shouldPromptReview(
  { resumeCount, lastReviewAt }: { resumeCount: number; lastReviewAt: Date | null },
  now: Date = new Date()
): boolean {
  if (resumeCount < 1) return false;
  if (!lastReviewAt) return true;
  return now.getTime() - lastReviewAt.getTime() > REVIEW_AGAIN_AFTER_DAYS * 86_400_000;
}

/** The two answers become one review, so the existing AI reads likes and dislikes from it. */
export function composeReviewText(likes: string, improve: string): string {
  const parts: string[] = [];
  if (likes.trim()) parts.push(`What I like: ${likes.trim()}`);
  if (improve.trim()) parts.push(`What could be better: ${improve.trim()}`);
  return parts.join("\n");
}
