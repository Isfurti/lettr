import { describe, expect, it } from "vitest";
import { runResumeChecks, penaltyFor, MAX_PENALTY } from "@/lib/resume-checks";
import { scoreResumeQuality } from "@/lib/resume-score";
import { emptyResume } from "@/lib/types";
import type { ResumeData } from "@/lib/types";

const NOW = new Date(2026, 10, 16); // 16 Nov 2026

function role(start: string, end: string, bullets: string[] = ["Led a team of 5 engineers"], extra: object = {}) {
  return { id: `r-${start}-${end}`, company: "Acme", role: "Engineer", startDate: start, endDate: end, bullets, ...extra };
}
function resume(over: Partial<ResumeData>): ResumeData {
  return { ...emptyResume, contact: { fullName: "Asha Rao", email: "a@example.com" }, ...over };
}
const ids = (r: ResumeData, opts = {}) => runResumeChecks(r, { now: NOW, ...opts }).map((f) => f.id);

describe("check 1: years claimed vs dates", () => {
  it("flags a claim well above the dates", () => {
    const r = resume({ summary: "Engineer with 10 years of experience in backend systems.", experience: [role("Jan 2021", "Present")] });
    const f = runResumeChecks(r, { now: NOW }).find((x) => x.id === "years-vs-dates");
    expect(f?.message).toMatch(/10 years/);
    expect(f?.message).toMatch(/about 6\./);
  });

  it("accepts a claim that matches, is a little generous, or is below the real span", () => {
    const six = [role("Jan 2021", "Present")];
    expect(ids(resume({ summary: "Engineer with 6 years of experience.", experience: six }))).not.toContain("years-vs-dates");
    expect(ids(resume({ summary: "Engineer with 7+ years of experience.", experience: six }))).not.toContain("years-vs-dates");
    expect(ids(resume({ summary: "Engineer with 3 years of experience.", experience: six }))).not.toContain("years-vs-dates");
  });

  it("counts overlapping jobs once, and earlier titles at the same company", () => {
    const overlap = [role("Jan 2020", "Dec 2022"), role("Jan 2021", "Dec 2022")];
    expect(ids(resume({ summary: "Analyst with 6 years of experience.", experience: overlap }))).toContain("years-vs-dates"); // really 3
    const promoted = [role("Jan 2022", "Present", ["Led a team"], { earlierRoles: [{ id: "e", role: "Junior", startDate: "Jan 2016", endDate: "Dec 2021" }] })];
    expect(ids(resume({ summary: "Manager with 10 years of experience.", experience: promoted }))).not.toContain("years-vs-dates"); // really ~11
  });

  it("stays quiet when it cannot be sure", () => {
    const base = { summary: "Engineer with 10 years of experience." };
    expect(ids(resume({ ...base, experience: [role("Jan 2021", "")] }))).not.toContain("years-vs-dates"); // unreadable end date
    expect(ids(resume({ ...base, experience: [role("sometime", "Present")] }))).not.toContain("years-vs-dates");
    expect(ids(resume({ ...base, experience: [] }))).not.toContain("years-vs-dates");
    expect(ids(resume({ summary: "Engineer, good communicator.", experience: [role("Jan 2025", "Present")] }))).not.toContain("years-vs-dates");
    expect(ids(resume({ ...base, experience: [role("Jan 2025", "Present")] }), { verifyDates: false })).not.toContain("years-vs-dates");
  });

  it("ignores years that are about someone else", () => {
    const r = resume({ summary: "Joined a team with 20 years of experience in audit.", experience: [role("Jan 2025", "Present")] });
    expect(ids(r)).not.toContain("years-vs-dates");
  });
});

describe("check 2: same figure told twice", () => {
  it("flags one figure under two roles", () => {
    const r = resume({
      experience: [
        { ...role("Jan 2022", "Present", ["Cut costs by 40%"]), company: "Acme" },
        { ...role("Jan 2019", "Dec 2021", ["Reduced churn by 40%"]), company: "Beta" },
      ],
    });
    expect(ids(r)).toContain("repeated-metric");
  });

  it("does not flag the summary repeating a best number, or a figure repeated inside one role", () => {
    const r = resume({ summary: "Cut costs by 40% at scale.", experience: [role("Jan 2022", "Present", ["Cut costs by 40%", "Kept it at 40% for a year"])] });
    expect(ids(r)).not.toContain("repeated-metric");
  });

  it("only counts percentages and money, not plain numbers", () => {
    const r = resume({ experience: [role("Jan 2022", "Present", ["Led 5 engineers"]), role("Jan 2019", "Dec 2021", ["Led 5 engineers"])] });
    expect(ids(r)).not.toContain("repeated-metric");
  });
});

describe("check 3: tool names", () => {
  it("flags wrong case and common misspellings, by whole entry", () => {
    const f = runResumeChecks(resume({ skills: ["Javascript", "Phtoshop", "Salesforce"] }), { now: NOW }).find((x) => x.id === "tool-names");
    expect(f?.message).toContain('"Javascript" as JavaScript');
    expect(f?.message).toContain('"Phtoshop" as Photoshop');
    expect(f?.message).not.toContain("Salesforce");
  });

  it("reads project tech lines", () => {
    const r = resume({ projects: [{ id: "p", name: "App", description: "x", tech: "Nextjs · Postgress" }] });
    expect(ids(r)).toContain("tool-names");
  });

  it("never touches ordinary words or correct names", () => {
    const r = resume({ skills: ["Stack management", "Scale planning", "Canvas", "Units", "Slack", "JavaScript", "Excel", "Customer service"] });
    expect(ids(r)).not.toContain("tool-names");
  });
});

describe("check 4: country format", () => {
  const withPersonal = (market: "US" | "UK" | "IN") =>
    resume({
      contact: { fullName: "A", email: "a@example.com", dateOfBirth: "1990-01-01", nationality: "Indian" },
      customization: { market },
    });

  it("gives advice (not a penalty) on personal details for US and UK", () => {
    for (const market of ["US", "UK"] as const) {
      const f = runResumeChecks(withPersonal(market), { now: NOW }).find((x) => x.id === "country-personal");
      expect(f?.scored).toBe(false);
      expect(f?.message).toMatch(/date of birth/);
    }
  });

  it("does nothing for India, Europe, Gulf, or when no market is chosen", () => {
    expect(ids(withPersonal("IN"))).toEqual([]);
    expect(ids(resume({ contact: { fullName: "A", email: "a@example.com", dateOfBirth: "1990-01-01" } }))).toEqual([]);
  });

  it("flags the other country's spelling only with two or more words, and ignores capitalised names", () => {
    const us = resume({ summary: "Organised teams and analysed colour data.", customization: { market: "US" } });
    expect(ids(us)).toContain("country-spelling");
    const uk = resume({ summary: "Led teams that organized events and analyzed data.", customization: { market: "UK" } });
    expect(ids(uk)).toContain("country-spelling");
    const one = resume({ summary: "Organised the team.", customization: { market: "US" } });
    expect(ids(one)).not.toContain("country-spelling");
    const name = resume({ summary: "Worked at the Centre for Policy Studies and the Defence Institute.", customization: { market: "US" } });
    expect(ids(name)).not.toContain("country-spelling");
    const fine = resume({ summary: "Licensed driver, organized events.", customization: { market: "UK" } });
    expect(ids(fine)).not.toContain("country-spelling"); // "licensed" and one word only
  });
});

describe("check 5: duty bullets", () => {
  it("flags two or more bullets that start with a duty phrase", () => {
    const r = resume({ experience: [role("Jan 2022", "Present", ["Responsible for the weekly report", "Worked on invoices", "Cut costs by 10%"])] });
    expect(runResumeChecks(r, { now: NOW }).find((f) => f.id === "duty-bullets")?.message).toMatch(/^2 bullets/);
  });
  it("leaves a single such bullet alone", () => {
    const r = resume({ experience: [role("Jan 2022", "Present", ["Responsible for the weekly report", "Cut costs by 10%"])] });
    expect(ids(r)).not.toContain("duty-bullets");
  });
});

describe("score integration", () => {
  const good: ResumeData = resume({
    summary: "Backend engineer with 12 years of experience building scalable systems and leading teams across product groups.",
    experience: [role("Jan 2024", "Present", ["Led a team of 5 engineers", "Reduced latency by 30%", "Built a billing system"])],
    education: [{ id: "ed", school: "IIT", degree: "BTech", startDate: "2012", endDate: "2016" }],
    skills: ["Javascript", "Python", "SQL", "AWS", "Docker"],
  });

  it("findings only lower the score, by at most the cap, and never raise it", () => {
    const withChecks = scoreResumeQuality(good, { now: NOW } as never);
    const clean = scoreResumeQuality({ ...good, summary: "Backend engineer with 2 years of experience building scalable systems and leading teams across product groups.", skills: ["JavaScript", "Python", "SQL", "AWS", "Docker"] });
    expect(withChecks.overall).toBeLessThan(clean.overall);
    expect(clean.overall - withChecks.overall).toBeLessThanOrEqual(MAX_PENALTY);
    expect(penaltyFor(runResumeChecks(good))).toBeLessThanOrEqual(MAX_PENALTY);
  });

  it("adds an Accuracy section with a jump target per tip, only when there are findings", () => {
    const r = scoreResumeQuality(good);
    const acc = r.sections.find((s) => s.key === "accuracy")!;
    expect(acc.tips.length).toBeGreaterThan(0);
    expect(acc.tipSections).toHaveLength(acc.tips.length);
    expect(scoreResumeQuality(emptyResume).sections.some((s) => s.key === "accuracy")).toBe(false);
  });

  it("keeps a blank resume at 0 and a resume with content above 0", () => {
    expect(scoreResumeQuality(emptyResume).overall).toBeLessThan(15);
    expect(scoreResumeQuality(emptyResume).overall).toBe(scoreResumeQuality(emptyResume).overall);
  });

  it("unscored advice does not change the number", () => {
    const base = resume({ summary: "Backend engineer building systems and leading teams across product groups for many years.", customization: { market: "US" } });
    const withDob = { ...base, contact: { ...base.contact, dateOfBirth: "1990-01-01" } };
    expect(scoreResumeQuality(withDob).overall).toBe(scoreResumeQuality(base).overall);
    expect(scoreResumeQuality(withDob).sections.some((s) => s.key === "accuracy")).toBe(true);
  });
});
