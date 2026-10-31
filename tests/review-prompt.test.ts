import { describe, it, expect } from "vitest";
import { shouldPromptReview, composeReviewText, REVIEW_AGAIN_AFTER_DAYS } from "@/lib/review-prompt";

const now = new Date("2026-11-01T00:00:00Z");
const daysAgo = (d: number) => new Date(now.getTime() - d * 86_400_000);

describe("shouldPromptReview", () => {
  it("waits until the user has made a resume", () => {
    expect(shouldPromptReview({ resumeCount: 0, lastReviewAt: null }, now)).toBe(false);
    expect(shouldPromptReview({ resumeCount: 1, lastReviewAt: null }, now)).toBe(true);
  });
  it("doesn't ask again soon after a review", () => {
    expect(shouldPromptReview({ resumeCount: 2, lastReviewAt: daysAgo(10) }, now)).toBe(false);
    expect(shouldPromptReview({ resumeCount: 2, lastReviewAt: daysAgo(REVIEW_AGAIN_AFTER_DAYS + 1) }, now)).toBe(true);
  });
});

describe("composeReviewText", () => {
  it("joins the two answers and skips empty ones", () => {
    expect(composeReviewText(" Fast ", "More colours")).toBe("What I like: Fast\nWhat could be better: More colours");
    expect(composeReviewText("", "More colours")).toBe("What could be better: More colours");
    expect(composeReviewText("  ", "")).toBe("");
  });
});
