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

describe("ATS score stays honest", () => {
  const SALES_JD =
    "Sales Executive (B2B) - Pune. Generate new leads and close B2B deals; manage the sales pipeline in Salesforce CRM; negotiate pricing with distributors; prepare weekly sales reports in Excel; build long-term client relationships. Requirements: B2B sales experience, negotiation and communication skills, advanced Excel, Marathi and Hindi.";
  const thin = {
    ...emptyResume,
    contact: { fullName: "Karan Mehta", email: "karan@example.com", phone: "+91 90000 00000", location: "Pune, India" },
    summary: "Hardworking person looking for a job in a good company where I can grow.",
    experience: [
      { id: "1", role: "Sales Executive", company: "ABC Traders", startDate: "Jun 2021", endDate: "Present", bullets: ["Responsible for sales in Pune region.", "Handled clients and did follow ups."] },
    ],
    education: [{ id: "e", school: "Pune University", degree: "B.Com", startDate: "", endDate: "" }],
    skills: ["MS Office", "Communication", "Hard working", "Team player"],
  };

  it("doesn't call a thin, generic resume good just because it has contact details and dates", () => {
    const r = analyzeAts(thin, "classic");
    expect(r.overall).toBeLessThan(50);
    expect(r.verdict).toMatch(/^Needs work/);
    expect(r.heldBackBy).toMatch(/very little content/);
  });

  it("keeps a poor keyword match from reading as good", () => {
    const r = analyzeAts(thin, "classic", SALES_JD);
    expect(r.keywords!.score).toBeLessThan(30);
    expect(r.overall).toBeLessThan(50);
    expect(r.heldBackBy).toMatch(/keyword match/);
  });

  it("flags an objective-style summary", () => {
    const r = analyzeAts(thin, "classic");
    const summary = r.categories.flatMap((c) => c.checks).find((c) => c.id === "summary")!;
    expect(summary.status).toBe("warn");
    expect(summary.label).toMatch(/objective/i);
  });

  it("reminds people to fill in AI blanks before applying", () => {
    const withBlank = {
      ...SAMPLE_RESUME,
      experience: [{ ...SAMPLE_RESUME.experience[0], bullets: ["Grew sales by [X]% in [time period]", ...SAMPLE_RESUME.experience[0].bullets] }, SAMPLE_RESUME.experience[1]],
    };
    const r = analyzeAts(withBlank, "classic");
    expect(r.topFixes.map((c) => c.id)).toContain("blanks");
  });

  it("still scores a strong resume well, and better with a matching job post", () => {
    const r = analyzeAts(SAMPLE_RESUME, "classic", JD);
    expect(r.keywords!.score).toBeGreaterThan(70);
    expect(r.overall).toBeGreaterThanOrEqual(70);
  });
});
