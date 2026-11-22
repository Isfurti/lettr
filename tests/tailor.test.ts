import { describe, it, expect } from "vitest";
import { planTailor, applyTailorChanges, reorderSkills, uniqueVersionName } from "@/lib/tailor";
import { emptyResume, type ResumeData } from "@/lib/types";

const resume: ResumeData = {
  ...emptyResume,
  summary: "Accounts executive with 2 years of experience.",
  skills: ["Tally", "Communication", "Excel", "GST filing"],
  experience: [
    { id: "e1", company: "Acme", role: "Accounts executive", startDate: "2023-01", endDate: "Present", bullets: ["Prepared GST returns for 40 clients in Tally.", "Answered phones."] },
  ],
};
const job = "We need an accounts executive with GST filing, Tally and Excel reconciliation skills. Python is a plus.";

describe("planTailor", () => {
  it("lists a job keyword the resume lacks as a gap and never as a skill", () => {
    const plan = planTailor(resume, job);
    expect(plan.gaps.join(" ").toLowerCase()).toContain("python");
    expect(plan.skillOrder ?? resume.skills).not.toContain("Python");
  });
  it("only reorders skills, keeping the same set", () => {
    const out = reorderSkills(resume.skills, job);
    if (out) expect([...out].sort()).toEqual([...resume.skills].sort());
    expect(out?.[out.length - 1]).toBe("Communication");
  });
  it("picks only bullets that already say something the job asks for", () => {
    const plan = planTailor(resume, job);
    expect(plan.targets.map((t) => t.bullet)).toEqual(["Prepared GST returns for 40 clients in Tally."]);
  });
  it("leaves grouped skills alone", () => {
    const plan = planTailor({ ...resume, skillGroups: [{ id: "g", name: "Tools", skills: ["Tally"] }] }, job);
    expect(plan.skillOrder).toBeNull();
    expect(plan.skillNote).toBeTruthy();
  });
});

describe("applyTailorChanges", () => {
  it("applies accepted changes to a copy and leaves the original untouched", () => {
    const snapshot = JSON.stringify(resume);
    const out = applyTailorChanges(resume, [
      { kind: "summary", before: resume.summary, after: "Accounts executive skilled in GST filing and Tally." },
      { kind: "bullet", id: "e1", i: 0, before: "Prepared GST returns for 40 clients in Tally.", after: "Filed GST returns for 40 clients using Tally." },
    ]);
    expect(out?.summary).toContain("GST filing");
    expect(out?.experience[0].bullets[0]).toContain("Filed GST");
    expect(JSON.stringify(resume)).toBe(snapshot);
  });
  it("refuses a stale change", () => {
    expect(applyTailorChanges(resume, [{ kind: "summary", before: "something else", after: "x" }])).toBeNull();
  });
  it("refuses a skills change that adds or drops a skill", () => {
    expect(applyTailorChanges(resume, [{ kind: "skills", before: resume.skills, after: [...resume.skills, "Python"] }])).toBeNull();
    expect(applyTailorChanges(resume, [{ kind: "skills", before: resume.skills, after: resume.skills.slice(1) }])).toBeNull();
  });
});

describe("uniqueVersionName", () => {
  it("numbers duplicates and trims", () => {
    expect(uniqueVersionName("  Legal   assistant ", [])).toBe("Legal assistant");
    expect(uniqueVersionName("Legal assistant", ["legal assistant"])).toBe("Legal assistant (2)");
    expect(uniqueVersionName("", [])).toBe("Tailored");
  });
});

import { checkTailoredVersion, looksLikeResume } from "@/lib/tailor";
import { ungroundedTerms } from "@/lib/ai-grounding";

describe("checkTailoredVersion", () => {
  const withBullet = (b: string): ResumeData => ({ ...resume, experience: [{ ...resume.experience[0], bullets: [b, "Answered phones."] }] });
  it("accepts a reworded bullet that uses only the person's own words", () => {
    expect(checkTailoredVersion(resume, withBullet("Filed GST returns for 40 clients in Tally."))).toBeNull();
  });
  it("refuses a bullet that names a tool the person never gave", () => {
    expect(checkTailoredVersion(resume, withBullet("Automated GST returns for 40 clients with Python."))).toMatch(/not in your original/);
  });
  it("refuses an added or dropped skill", () => {
    expect(checkTailoredVersion(resume, { ...resume, skills: [...resume.skills, "Python"] })).toMatch(/skills/);
  });
  it("refuses a change to anything else, such as a job title", () => {
    const changed = { ...resume, experience: [{ ...resume.experience[0], role: "Finance manager" }] };
    expect(checkTailoredVersion(resume, changed)).toMatch(/only change/);
  });
  it("refuses a summary that names an employer or tool not in the original", () => {
    expect(checkTailoredVersion(resume, { ...resume, summary: "Accounts executive formerly at Infosys." })).toMatch(/summary/);
  });
});

describe("looksLikeResume", () => {
  it("rejects junk and accepts a real resume", () => {
    expect(looksLikeResume({ summary: 5 })).toBe(false);
    expect(looksLikeResume(null)).toBe(false);
    expect(looksLikeResume(resume)).toBe(true);
  });
});

describe("ungroundedTerms: names at the start of a sentence and common lower-case names", () => {
  it("catches a tool or employer that opens a sentence", () => {
    expect(ungroundedTerms("Python scripts cut reporting time.", "Cut reporting time with Excel.")).toContain("Python");
    expect(ungroundedTerms("Built app. Google hired me.", "Built an app.")).toContain("Google");
  });
  it("catches common lower-case names not in the source", () => {
    expect(ungroundedTerms("trained models in tensorflow", "trained models")).toContain("tensorflow");
  });
  it("does not flag ordinary opening verbs", () => {
    expect(ungroundedTerms("Managed a team. Led the audit. Streamlining filing.", "Managed a team, led the audit, filing.")).toEqual([]);
  });
});
