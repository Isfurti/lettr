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

describe("keyword quality on a real job post", () => {
  const JD =
    "Sales Executive (B2B) - Pune. We are hiring a Sales Executive to grow our dealer network in Maharashtra. Responsibilities: generate new leads and close B2B deals; manage the sales pipeline in Salesforce CRM; negotiate pricing with distributors; achieve monthly revenue targets; prepare weekly sales reports in Excel; build long-term client relationships. Requirements: 2-4 years of B2B sales experience, strong negotiation and communication skills, experience with CRM tools (Salesforce preferred), advanced Excel, fluency in Marathi and Hindi, a two-wheeler and willingness to travel.";

  it("skips places, generic verbs and job-title words", () => {
    const keywords = extractKeywords(JD);
    for (const word of ["pune", "maharashtra", "grow", "generate", "close", "manage", "build", "executive", "two-wheeler", "travel", "2-4"]) {
      expect(keywords).not.toContain(word);
    }
  });

  it("finds the skills, tools and phrases the job actually asks for, most important first", () => {
    const keywords = extractKeywords(JD);
    expect(keywords).toEqual(
      expect.arrayContaining(["b2b sales", "sales pipeline", "client relationships", "salesforce", "crm", "excel", "negotiation", "marathi"])
    );
    expect(keywords.indexOf("salesforce")).toBeLessThan(keywords.indexOf("dealer"));
  });

  it("matches plurals and word families", () => {
    const resume: ResumeData = {
      ...emptyResume,
      experience: [
        { id: "1", role: "Sales Executive", company: "ABC", startDate: "Jun 2021", endDate: "Present", bullets: ["Negotiated pricing with 12 distributors and kept every client relationship"] },
      ],
    };
    const result = scoreResumeAgainstJob(resume, JD);
    expect(result.matchedKeywords).toEqual(expect.arrayContaining(["negotiation", "pricing", "distributors", "client relationships"]));
  });

  it("scores a generic resume low instead of matching on words like 'grow' or 'Pune'", () => {
    const resume: ResumeData = {
      ...emptyResume,
      summary: "Hardworking person looking for a job in a good company where I can grow.",
      experience: [
        { id: "1", role: "Sales Executive", company: "ABC Traders", startDate: "Jun 2021", endDate: "Present", bullets: ["Responsible for sales in Pune region.", "Handled clients and did follow ups."] },
      ],
      skills: ["MS Office", "Communication", "Hard working", "Team player"],
    };
    const result = scoreResumeAgainstJob(resume, JD);
    expect(result.matchedKeywords).not.toContain("grow");
    expect(result.matchedKeywords).not.toContain("pune");
    expect(result.score).toBeLessThan(20);
  });
});
