import { describe, it, expect } from "vitest";
import { scoreResumeQuality } from "@/lib/resume-score";
import { emptyResume } from "@/lib/types";
import type { ResumeData } from "@/lib/types";

describe("scoreResumeQuality", () => {
  it("scores a completely empty resume very low", () => {
    const result = scoreResumeQuality(emptyResume);
    expect(result.overall).toBeLessThan(15);
  });

  it("gives contact section full marks when name, email, phone, and location are present", () => {
    const resume: ResumeData = {
      ...emptyResume,
      contact: { fullName: "Jane Doe", email: "jane@example.com", phone: "555-1234", location: "Austin, TX" },
    };
    const result = scoreResumeQuality(resume);
    const contact = result.sections.find((s) => s.key === "contact")!;
    expect(contact.score).toBe(100);
    expect(contact.tips).toHaveLength(0);
  });

  it("flags a missing summary", () => {
    const result = scoreResumeQuality(emptyResume);
    const summary = result.sections.find((s) => s.key === "summary")!;
    expect(summary.score).toBe(0);
    expect(summary.tips[0]).toMatch(/add a/i);
  });

  it("penalizes first-person pronouns in the summary", () => {
    const resume: ResumeData = {
      ...emptyResume,
      summary: "I am a backend engineer who I think is great at building scalable systems for teams.",
    };
    const result = scoreResumeQuality(resume);
    const summary = result.sections.find((s) => s.key === "summary")!;
    expect(summary.tips.some((t) => /first-person/i.test(t))).toBe(true);
  });

  it("rewards summaries without first-person pronouns and reasonable length", () => {
    const resume: ResumeData = {
      ...emptyResume,
      summary: "Backend engineer with over five years of experience building scalable systems and leading cross-functional engineering teams.",
    };
    const result = scoreResumeQuality(resume);
    const summary = result.sections.find((s) => s.key === "summary")!;
    expect(summary.score).toBeGreaterThanOrEqual(80);
  });

  it("scores experience with strong action verbs and numbers highly", () => {
    const resume: ResumeData = {
      ...emptyResume,
      experience: [
        {
          id: "e1",
          company: "Acme",
          role: "Engineer",
          startDate: "2021",
          endDate: "Present",
          bullets: [
            "Led a team of 5 engineers to reduce API latency by 40%",
            "Built a CI/CD pipeline that cut deploy time from 2 hours to 15 minutes",
            "Increased test coverage from 30% to 85%",
          ],
        },
      ],
    };
    const result = scoreResumeQuality(resume);
    const experience = result.sections.find((s) => s.key === "experience")!;
    expect(experience.score).toBeGreaterThan(70);
  });

  it("scores experience with weak, vague bullets lower", () => {
    const resume: ResumeData = {
      ...emptyResume,
      experience: [
        {
          id: "e1",
          company: "Acme",
          role: "Engineer",
          startDate: "2021",
          endDate: "Present",
          bullets: ["Was responsible for stuff", "Worked on things"],
        },
      ],
    };
    const result = scoreResumeQuality(resume);
    const experience = result.sections.find((s) => s.key === "experience")!;
    expect(experience.score).toBeLessThan(50);
    expect(experience.tips.length).toBeGreaterThan(0);
  });

  it("gives 0 experience score when there are no roles at all", () => {
    const result = scoreResumeQuality(emptyResume);
    const experience = result.sections.find((s) => s.key === "experience")!;
    expect(experience.score).toBe(0);
  });

  it("flags too few skills", () => {
    const resume: ResumeData = { ...emptyResume, skills: ["Python", "SQL"] };
    const result = scoreResumeQuality(resume);
    const skills = result.sections.find((s) => s.key === "skills")!;
    expect(skills.score).toBeLessThan(100);
    expect(skills.tips.length).toBeGreaterThan(0);
  });

  it("gives full marks for a healthy number of skills", () => {
    const resume: ResumeData = {
      ...emptyResume,
      skills: ["Python", "Django", "PostgreSQL", "AWS", "Docker", "CI/CD"],
    };
    const result = scoreResumeQuality(resume);
    const skills = result.sections.find((s) => s.key === "skills")!;
    expect(skills.score).toBe(100);
  });

  it("overall score improves as a resume gets more complete", () => {
    const thin = scoreResumeQuality(emptyResume);
    const complete: ResumeData = {
      contact: { fullName: "Jane Doe", email: "jane@example.com", phone: "555-1234", location: "Austin, TX" },
      summary: "Backend engineer with over 5 years of experience building scalable systems and leading small cross-functional engineering teams.",
      experience: [
        {
          id: "e1",
          company: "Acme",
          role: "Engineer",
          startDate: "2021",
          endDate: "Present",
          bullets: [
            "Led a team of 5 engineers to reduce API latency by 40%",
            "Built a CI/CD pipeline that cut deploy time from 2 hours to 15 minutes",
          ],
        },
      ],
      education: [{ id: "ed1", school: "State University", degree: "B.S. Computer Science", startDate: "2015", endDate: "2019" }],
      skills: ["Python", "Django", "PostgreSQL", "AWS", "Docker"],
    };
    const full = scoreResumeQuality(complete);
    expect(full.overall).toBeGreaterThan(thin.overall);
    expect(full.overall).toBeGreaterThan(70);
  });
});
