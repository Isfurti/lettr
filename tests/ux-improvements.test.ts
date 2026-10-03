import { describe, it, expect } from "vitest";
import { scoreResumeAgainstJob, extractKeywords } from "@/lib/ats-score";
import { emptyResume, extraSections, type ResumeData } from "@/lib/types";
import { guestDraftHasContent } from "@/lib/guest-draft";
import { pdfFonts } from "@/lib/pdf-fonts";

describe("job-description filler words", () => {
  it("doesn't treat generic JD words or bare numbers as keywords", () => {
    const keywords = extractKeywords(
      "We need 5+ years of experience. Strong stakeholder management required. Experience with HubSpot preferred."
    );
    for (const filler of ["years", "experience", "strong", "required", "preferred", "need", "5+"]) {
      expect(keywords).not.toContain(filler);
    }
    expect(keywords).toContain("hubspot");
    expect(keywords).toContain("stakeholder");
  });
});

describe("optional resume sections", () => {
  it("are safe to read on older resumes that don't have them", () => {
    expect(extraSections(emptyResume)).toEqual({ projects: [], certifications: [], languages: [], achievements: [] });
  });

  it("drop blank entries", () => {
    const r: ResumeData = {
      ...emptyResume,
      projects: [{ id: "1", name: "", description: "" }, { id: "2", name: "Lettr", description: "" }],
      languages: ["English", "  "],
    };
    const extra = extraSections(r);
    expect(extra.projects.map((p) => p.id)).toEqual(["2"]);
    expect(extra.languages).toEqual(["English"]);
  });

  it("count toward the job match", () => {
    const r: ResumeData = { ...emptyResume, certifications: [{ id: "c", name: "Salesforce Administrator" }] };
    const result = scoreResumeAgainstJob(r, "Salesforce administrator wanted. Salesforce certification a must.");
    expect(result.matchedKeywords).toContain("salesforce");
  });
});

describe("guestDraftHasContent", () => {
  it("ignores an untouched blank draft", () => {
    expect(guestDraftHasContent(null)).toBe(false);
    expect(guestDraftHasContent({ data: emptyResume, template: "classic" })).toBe(false);
  });

  it("detects a draft with real content", () => {
    const data = { ...emptyResume, contact: { fullName: "Priya", email: "" } };
    expect(guestDraftHasContent({ data, template: "classic" })).toBe(true);
  });
});

describe("pdfFonts", () => {
  it("maps each font pair to the matching PDF families", () => {
    const pick = (fontChoice: "editorial" | "elegant" | "classic") =>
      pdfFonts({ ...emptyResume, customization: { fontChoice } });
    expect(pick("editorial").body).toContain("Manrope");
    expect(pick("elegant").display).toContain("Playfair");
    expect(pick("classic").body).toContain("Helvetica");
  });
});
