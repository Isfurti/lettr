import { describe, it, expect } from "vitest";
import {
  canCreateResume,
  canDownloadPdf,
  canUseCoverLetterBuilder,
  canUseResignationLetterBuilder,
  canExportDocx,
  canExportToGoogleDrive,
  canUseAiWritingAssist,
  canUseAiAgent,
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

describe("canDownloadPdf", () => {
  it("allows a free user under the 3-download limit", () => {
    expect(canDownloadPdf("free", 2).allowed).toBe(true);
  });

  it("blocks a free user at exactly the limit", () => {
    expect(canDownloadPdf("free", 3).allowed).toBe(false);
  });

  it("never blocks a pro user", () => {
    expect(canDownloadPdf("pro", 100000).allowed).toBe(true);
  });
});

describe("pro-only feature gates", () => {
  it("blocks cover letter builder on free", () => {
    expect(canUseCoverLetterBuilder("free").allowed).toBe(false);
  });
  it("allows cover letter builder on pro", () => {
    expect(canUseCoverLetterBuilder("pro").allowed).toBe(true);
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
  it("allows a free user under the 5-call lifetime cap", () => {
    expect(canUseAiWritingAssist("free", 0).allowed).toBe(true);
    expect(canUseAiWritingAssist("free", 4).allowed).toBe(true);
  });

  it("blocks a free user at exactly the lifetime cap", () => {
    const result = canUseAiWritingAssist("free", 5);
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
