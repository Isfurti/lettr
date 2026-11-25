import { describe, expect, it } from "vitest";
import { analyzeAts } from "@/lib/ats-analyst";
import { resumeHasContent } from "@/lib/resume-content";
import type { ResumeData } from "@/lib/types";

const blank: ResumeData = { contact: { fullName: "", email: "" }, summary: "", experience: [], education: [], skills: [] };

describe("blank resume", () => {
  it("has no content with only contact details or an empty row", () => {
    expect(resumeHasContent(blank)).toBe(false);
    expect(resumeHasContent({ ...blank, contact: { fullName: "Asha", email: "a@b.co" } })).toBe(false);
    expect(
      resumeHasContent({ ...blank, experience: [{ id: "1", company: "", role: "", startDate: "", endDate: "", bullets: [" "] }] }),
    ).toBe(false);
  });

  it("counts any filled section, including projects and certifications", () => {
    expect(resumeHasContent({ ...blank, summary: "Marketing graduate" })).toBe(true);
    expect(resumeHasContent({ ...blank, projects: [{ id: "p", name: "Budget app", description: "" }] })).toBe(true);
    expect(resumeHasContent({ ...blank, certifications: [{ id: "c", name: "Google Analytics" }] })).toBe(true);
  });

  it("scores 0 on every part, and normally once there is content", () => {
    const empty = analyzeAts(blank, "classic");
    expect(empty.overall).toBe(0);
    expect(empty.categories.every((c) => c.score === 0)).toBe(true);
    expect(analyzeAts({ ...blank, summary: "Marketing graduate with two internships." }, "classic").overall).toBeGreaterThan(0);
  });
});
