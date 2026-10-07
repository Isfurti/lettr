import { describe, it, expect } from "vitest";
import {
  canCreateResume,
  pdfNeedsFooter,
  limitTier,
  canTrackJob,
  canUseAtsAnalyst,
  canUseInterviewPractice,
  FREE_PLAN_V2_FROM,
  canUseCoverLetterBuilder,
  canUseResignationLetterBuilder,
  canExportDocx,
  canExportToGoogleDrive,
  canUseAiWritingAssist,
  canUseAiAgent,
  canUseTemplate,
} from "@/lib/limits";

describe("canCreateResume", () => {
  it("allows a free user with 0 resumes to create one", () => {
    expect(canCreateResume("free", 0).allowed).toBe(true);
  });

  it("blocks a free user who already has 1 resume", () => {
    const result = canCreateResume("free", 1);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toMatch(/upgrade/i);
  });

  it("allows a pro user with many resumes to create more", () => {
    expect(canCreateResume("pro", 500).allowed).toBe(true);
  });
});

describe("PDF downloads", () => {
  it("gives a new free user one clean PDF, then adds the Made with Lettr line", () => {
    expect(pdfNeedsFooter("free", 0)).toBe(false);
    expect(pdfNeedsFooter("free", 1)).toBe(true);
  });
  it("keeps 3 clean PDFs for older free accounts", () => {
    expect(pdfNeedsFooter("free_legacy", 2)).toBe(false);
    expect(pdfNeedsFooter("free_legacy", 3)).toBe(true);
  });
  it("never adds the line for Pro", () => {
    expect(pdfNeedsFooter("pro", 100000)).toBe(false);
  });
});

describe("limitTier", () => {
  it("puts accounts made before the change on the old free limits", () => {
    expect(limitTier({ plan: "free", created_at: "2026-09-01T00:00:00Z" })).toBe("free_legacy");
    expect(limitTier({ plan: "free", created_at: new Date(FREE_PLAN_V2_FROM.getTime() + 1000) })).toBe("free");
    expect(limitTier({ plan: "pro", created_at: "2026-01-01T00:00:00Z" })).toBe("pro");
    expect(limitTier(null)).toBe("free");
  });
});

describe("once-per-person free plan", () => {
  it("allows each AI feature once", () => {
    expect(canUseCoverLetterBuilder("free", 0).allowed).toBe(true);
    expect(canUseCoverLetterBuilder("free", 1).allowed).toBe(false);
    expect(canUseAtsAnalyst("free", 0).allowed).toBe(true);
    expect(canUseAtsAnalyst("free", 1).allowed).toBe(false);
    expect(canUseInterviewPractice("free", "set", 1).allowed).toBe(false);
    expect(canUseInterviewPractice("free", "feedback", 5).allowed).toBe(true);
    expect(canUseInterviewPractice("free", "feedback", 6).allowed).toBe(false);
    expect(canUseAiWritingAssist("free", 2).allowed).toBe(true);
    expect(canUseAiWritingAssist("free", 3).allowed).toBe(false);
  });
  it("says to upgrade, not to wait for next month", () => {
    const r = canUseCoverLetterBuilder("free", 1);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).not.toMatch(/month/);
  });
  it("tracks up to 10 jobs free", () => {
    expect(canTrackJob("free", 9).allowed).toBe(true);
    expect(canTrackJob("free", 10).allowed).toBe(false);
    expect(canTrackJob("free_legacy", 500).allowed).toBe(true);
    expect(canTrackJob("pro", 500).allowed).toBe(true);
  });
});

describe("pro-only feature gates", () => {
  it("gives older free accounts 3 cover letters a month", () => {
    expect(canUseCoverLetterBuilder("free_legacy", 0).allowed).toBe(true);
    expect(canUseCoverLetterBuilder("free_legacy", 2).allowed).toBe(true);
    const blocked = canUseCoverLetterBuilder("free_legacy", 3, new Date("2026-10-20T10:00:00Z"));
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) expect(blocked.reason).toContain("1 November");
  });
  it("allows cover letter builder on pro without a monthly limit", () => {
    expect(canUseCoverLetterBuilder("pro", 5000).allowed).toBe(true);
  });

  it("blocks resignation letter builder on free", () => {
    expect(canUseResignationLetterBuilder("free").allowed).toBe(false);
  });
  it("allows resignation letter builder on pro", () => {
    expect(canUseResignationLetterBuilder("pro").allowed).toBe(true);
  });

  it("blocks DOCX export on free", () => {
    expect(canExportDocx("free").allowed).toBe(false);
  });
  it("blocks Google Drive export on free", () => {
    expect(canExportToGoogleDrive("free").allowed).toBe(false);
  });
});

describe("canUseAiWritingAssist - lifetime cap, not a rate limit", () => {
  it("allows a free user under the 3-call lifetime cap (5 for older accounts)", () => {
    expect(canUseAiWritingAssist("free", 0).allowed).toBe(true);
    expect(canUseAiWritingAssist("free", 2).allowed).toBe(true);
    expect(canUseAiWritingAssist("free_legacy", 4).allowed).toBe(true);
  });

  it("blocks a free user at exactly the lifetime cap", () => {
    const result = canUseAiWritingAssist("free", 3);
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toMatch(/upgrade/i);
  });

  it("blocks a free user well past the cap too - doesn't somehow re-allow at higher counts", () => {
    expect(canUseAiWritingAssist("free", 500).allowed).toBe(false);
  });

  it("never blocks a pro user, at any count", () => {
    expect(canUseAiWritingAssist("pro", 0).allowed).toBe(true);
    expect(canUseAiWritingAssist("pro", 100000).allowed).toBe(true);
  });
});

describe("canUseAiAgent - moved to Pro-only", () => {
  it("blocks free users", () => {
    const result = canUseAiAgent("free");
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toMatch(/pro/i);
  });

  it("allows pro users", () => {
    expect(canUseAiAgent("pro").allowed).toBe(true);
  });
});

describe("canUseTemplate - free tier limited to 2 templates", () => {
  it("allows free users to use Classic", () => {
    expect(canUseTemplate("free", "classic").allowed).toBe(true);
  });

  it("allows free users to use Modern", () => {
    expect(canUseTemplate("free", "modern").allowed).toBe(true);
  });

  it("blocks free users from Pro-only templates", () => {
    const result = canUseTemplate("free", "sidebar");
    expect(result.allowed).toBe(false);
    if (!result.allowed) expect(result.reason).toMatch(/pro/i);
  });

  it("blocks free users from every non-free template, not just one example", () => {
    for (const t of ["compact", "bold", "sidebar", "minimal", "executive", "technical", "timeline", "elegant"]) {
      expect(canUseTemplate("free", t).allowed).toBe(false);
    }
  });

  it("allows pro users to use any template, including the free ones", () => {
    expect(canUseTemplate("pro", "classic").allowed).toBe(true);
    expect(canUseTemplate("pro", "sidebar").allowed).toBe(true);
    expect(canUseTemplate("pro", "elegant").allowed).toBe(true);
  });

  it("blocks an unknown/invalid template id for free users rather than defaulting to allowed", () => {
    expect(canUseTemplate("free", "not-a-real-template").allowed).toBe(false);
  });
});
