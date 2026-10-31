import { describe, it, expect } from "vitest";
import { isAppPage, shouldAsk, snooze, composeReview, VIEWS_BEFORE_ASK } from "@/lib/review-prompt";

describe("review prompt rules", () => {
  it("only runs on app pages, not the feedback page", () => {
    expect(isAppPage("/dashboard")).toBe(true);
    expect(isAppPage("/dashboard/applications")).toBe(true);
    expect(isAppPage("/builder/abc")).toBe(true);
    expect(isAppPage("/dashboard/feedback")).toBe(false);
    expect(isAppPage("/")).toBe(false);
    expect(isAppPage("/admin")).toBe(false);
  });
  it("asks after a few visits, or after a download", () => {
    const now = 1_000;
    expect(shouldAsk({ views: VIEWS_BEFORE_ASK - 1 }, now)).toBe(false);
    expect(shouldAsk({ views: VIEWS_BEFORE_ASK }, now)).toBe(true);
    expect(shouldAsk({ views: 1 }, now, true)).toBe(true);
  });
  it("never asks again once answered, and waits a week after Not now", () => {
    expect(shouldAsk({ views: 99, done: true }, 0)).toBe(false);
    const s = snooze({ views: 9 }, 0);
    expect(s.views).toBe(0);
    expect(shouldAsk({ ...s, views: 99 }, 6 * 86_400_000)).toBe(false);
    expect(shouldAsk({ ...s, views: 99 }, 8 * 86_400_000)).toBe(true);
  });
  it("turns the two answers into one review the API accepts", () => {
    expect(composeReview(4, "the ATS score", "")).toBe("What I like: the ATS score");
    expect(composeReview(3, "", "faster PDF")).toBe("What to improve: faster PDF");
    expect(composeReview(5, "", "").length).toBeGreaterThanOrEqual(10);
  });
});
