import { describe, it, expect } from "vitest";
import { addSkill, contactParts, joinLanguage, personalFieldsFor, splitLanguage } from "@/lib/contact";
import { bulletsGuide, pageTarget, skillsGuide, summaryGuide } from "@/lib/guidance";
import { analyzeAts } from "@/lib/ats-analyst";
import type { ResumeData } from "@/lib/types";

const base = (over: Partial<ResumeData> = {}): ResumeData => ({
  contact: { fullName: "Asha Rao", email: "asha@example.com", phone: "+91 98765 43210", location: "Pune, India" },
  summary: "Marketing executive with five years in SEO and email, growing organic traffic for retail brands and reporting weekly to sales leaders.",
  experience: [
    {
      id: "1",
      company: "Brightline",
      role: "Marketing Executive",
      startDate: "Jan 2021",
      endDate: "Present",
      bullets: ["Grew organic traffic 48% in nine months", "Ran weekly email campaigns for 12,000 subscribers", "Cut cost per lead 20%"],
    },
  ],
  education: [{ id: "e", school: "Pune University", degree: "BBA", startDate: "2016", endDate: "2019" }],
  skills: ["SEO", "Email marketing", "Google Analytics", "Excel", "Canva", "HubSpot"],
  customization: {},
  ...over,
});

describe("personal details", () => {
  it("are offered for the Gulf only, and stay visible once filled", () => {
    const c = base().contact;
    expect(personalFieldsFor("GULF", c)).toEqual(["nationality", "visaStatus", "dateOfBirth"]);
    expect(personalFieldsFor("US", c)).toEqual([]);
    expect(personalFieldsFor("US", { ...c, nationality: "Indian" })).toEqual(["nationality"]);
  });

  it("print on the contact line with labels", () => {
    const parts = contactParts({ ...base().contact, nationality: "Indian", visaStatus: "UAE residence visa", dateOfBirth: "12 March 1995" });
    expect(parts).toContain("Nationality: Indian");
    expect(parts).toContain("Visa: UAE residence visa");
    expect(parts).toContain("Date of birth: 12 March 1995");
    expect(contactParts(base().contact)).toEqual(["asha@example.com", "+91 98765 43210", "Pune, India"]);
  });

  it("are flagged by the ATS check for markets that don't expect them", () => {
    const r = base({ contact: { ...base().contact, dateOfBirth: "12 March 1995" }, customization: { market: "UK" } });
    const check = analyzeAts(r, "classic").categories.flatMap((c) => c.checks).find((c) => c.id === "personal");
    expect(check?.status).not.toBe("pass");
  });
});

describe("language levels", () => {
  it("round-trip through the language text", () => {
    expect(splitLanguage("German (B2)")).toEqual({ name: "German", level: "B2" });
    expect(splitLanguage("Hindi")).toEqual({ name: "Hindi", level: "" });
    expect(joinLanguage("German", "C1")).toBe("German (C1)");
    expect(joinLanguage("German", "")).toBe("German");
  });
});

describe("one-click keywords", () => {
  it("adds a missing keyword once", () => {
    expect(addSkill(["SEO"], "Tableau")).toEqual(["SEO", "Tableau"]);
    expect(addSkill(["SEO"], "seo")).toEqual(["SEO"]);
  });
});

describe("guidance counters", () => {
  it("match the analyst's ranges", () => {
    expect(summaryGuide("one two three").ok).toBe(false);
    expect(summaryGuide(Array(40).fill("word").join(" ")).text).toBe("40 words · aim for 30–90");
    expect(bulletsGuide(["a", "b", ""]).text).toBe("2 bullets · aim for 2–6 per role");
    expect(skillsGuide(["a", "b"]).ok).toBe(false);
  });
});

describe("page length", () => {
  const now = new Date("2026-11-13");
  it("follows the market", () => {
    expect(pageTarget("US", base(), now)).toBe(1);
    expect(pageTarget("UK", base(), now)).toBe(2);
    const senior = base({ experience: [{ ...base().experience[0], startDate: "Jan 2012" }] });
    expect(pageTarget("US", senior, now)).toBe(2);
    expect(pageTarget("IN", senior, now)).toBe(2);
  });

  it("adds a check only when the pages were measured", () => {
    const r = base({ customization: { market: "US" } });
    const find = (p?: number) => analyzeAts(r, "classic", undefined, p).categories.flatMap((c) => c.checks).find((c) => c.id === "pages");
    expect(find()).toBeUndefined();
    expect(find(1)?.status).toBe("pass");
    expect(find(2)?.status).toBe("warn");
    expect(find(3)?.status).toBe("fail");
  });

  it("category points add up to 100 before any cap", () => {
    const report = analyzeAts(base(), "classic");
    expect(report.categories.reduce((n, c) => n + c.weight, 0)).toBe(100);
  });
});
