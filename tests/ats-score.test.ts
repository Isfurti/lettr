import { describe, it, expect } from "vitest";
import { scoreResumeAgainstJob, extractKeywords } from "@/lib/ats-score";
import { emptyResume } from "@/lib/types";
import type { ResumeData } from "@/lib/types";

describe("extractKeywords", () => {
  it("extracts frequent non-stopword tokens", () => {
    const jd = "We need a React developer with React and TypeScript experience. React is required.";
    const keywords = extractKeywords(jd, 5);
    expect(keywords[0]).toBe("react");
    expect(keywords).toContain("typescript");
    expect(keywords).not.toContain("with");
    expect(keywords).not.toContain("and");
  });

  it("returns an empty array for empty input", () => {
    expect(extractKeywords("")).toEqual([]);
  });

  it("strips sentence-final punctuation stuck to a word", () => {
    const jd = "Experience with AWS deployment.";
    const keywords = extractKeywords(jd, 10);
    expect(keywords).toContain("deployment");
    expect(keywords).not.toContain("deployment.");
  });
});

describe("scoreResumeAgainstJob", () => {
  const jd = "Looking for a Python engineer skilled in Django, PostgreSQL, and AWS deployment.";

  it("scores 0-ish for a resume with no overlapping keywords", () => {
    const resume: ResumeData = {
      ...emptyResume,
      summary: "Graphic designer with expertise in Photoshop and Illustrator.",
    };
    const result = scoreResumeAgainstJob(resume, jd);
    expect(result.score).toBeLessThan(30);
    expect(result.missingKeywords.length).toBeGreaterThan(0);
  });

  it("scores high for a resume matching the job description keywords", () => {
    const resume: ResumeData = {
      ...emptyResume,
      summary: "Python engineer building services with Django and deploying on AWS.",
      skills: ["Python", "Django", "PostgreSQL", "AWS"],
    };
    const result = scoreResumeAgainstJob(resume, jd);
    expect(result.score).toBeGreaterThan(55);
    expect(result.matchedKeywords).toContain("django");
    expect(result.matchedKeywords).toContain("postgresql");
  });

  it("returns 100 when the job description has no extractable keywords", () => {
    const result = scoreResumeAgainstJob(emptyResume, "the and a of");
    expect(result.score).toBe(100);
  });

  it("matched + missing keywords always add up to total", () => {
    const result = scoreResumeAgainstJob(emptyResume, jd);
    expect(result.matchedKeywords.length + result.missingKeywords.length).toBe(result.totalKeywords);
  });
});
