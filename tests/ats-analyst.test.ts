import { describe, it, expect } from "vitest";
import { analyzeAts } from "@/lib/ats-analyst";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import { emptyResume } from "@/lib/types";

const JD = "We are hiring a Product Marketing Manager to own positioning, product launches, SEO and HubSpot email campaigns. SQL and A/B testing a plus.";

describe("ATS score analyst", () => {
  it("scores a solid resume well and a blank one badly", () => {
    const good = analyzeAts(SAMPLE_RESUME, "classic");
    const blank = analyzeAts(emptyResume, "classic");
    expect(good.overall).toBeGreaterThan(70);
    expect(blank.overall).toBeLessThan(45);
    expect(blank.topFixes[0].status).toBe("fail");
    expect(good.categories.map((c) => c.id)).toEqual(["readable", "content", "structure"]);
  });
  it("adds keyword matching when a job post is given", () => {
    const r = analyzeAts(SAMPLE_RESUME, "classic", JD);
    expect(r.categories.map((c) => c.id)).toContain("keywords");
    expect(r.keywords?.missingKeywords.length).toBeGreaterThan(0);
  });
  it("warns about two-column layouts, photos and odd characters", () => {
    const r = analyzeAts(
      { ...SAMPLE_RESUME, summary: "★ Marketer ★", customization: { showPhoto: true, photoDataUrl: "data:image/png;base64,x" } },
      "sidebar"
    );
    const readable = r.categories.find((c) => c.id === "readable")!;
    const st = Object.fromEntries(readable.checks.map((c) => [c.id, c.status]));
    expect(st).toMatchObject({ layout: "warn", photo: "warn", chars: "warn" });
  });
  it("catches a bad email, missing dates and jobs out of order", () => {
    const r = analyzeAts(
      {
        ...SAMPLE_RESUME,
        contact: { ...SAMPLE_RESUME.contact, email: "priya-at-gmail" },
        experience: [
          { ...SAMPLE_RESUME.experience[1], startDate: "Jun 2015", endDate: "Feb 2018" },
          { ...SAMPLE_RESUME.experience[0], startDate: "", endDate: "Present" },
        ],
      },
      "classic"
    );
    const all = Object.fromEntries(r.categories.flatMap((c) => c.checks).map((c) => [c.id, c.status]));
    expect(all).toMatchObject({ email: "fail", dates: "fail", order: "warn" });
  });
});
