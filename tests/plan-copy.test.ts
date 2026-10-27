import { describe, it, expect } from "vitest";
import { FREE_AI_TRY_LINE, PLAN_LIMITS } from "@/lib/limits";

describe("free plan wording", () => {
  it("names the real free AI allowances", () => {
    const f = PLAN_LIMITS.free;
    expect(FREE_AI_TRY_LINE).toBe(
      `Try the AI free: ${f.maxAiWritingAssists} rewrites, ${f.coverLetters} cover letter, ${f.atsAnalyst} ATS review and ${f.interviewSets} practice interview`
    );
  });
});
