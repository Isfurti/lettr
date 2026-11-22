import { beforeEach, describe, expect, it, vi } from "vitest";
import { AMERICAN, BRITISH, runResumeChecks } from "@/lib/resume-checks";
import { SPELLING_PAIRS, applyEdits, fixesFor, respell, undoEdits, type Edit } from "@/lib/resume-fixes";
import { scoreResumeQuality } from "@/lib/resume-score";
import { DAILY_LIMITS, PLAN_LIMITS, canUseAiFix, canUseAiToday } from "@/lib/limits";
import { emptyResume, type ResumeData } from "@/lib/types";

// A scripted model for the AI fix, so "never invents facts" runs the real guard path.
const replies: string[] = [];
vi.mock("@anthropic-ai/sdk", () => ({
  default: class {
    messages = {
      create: async () => ({ content: [{ type: "text", text: replies.shift() ?? "[]" }], usage: { input_tokens: 10, output_tokens: 10 } }),
    };
  },
}));
import { polishBullet } from "@/lib/ai";

beforeEach(() => {
  replies.length = 0;
  process.env.ANTHROPIC_API_KEY = "test";
});

const base: ResumeData = {
  ...emptyResume,
  contact: { fullName: "Asha Rao", email: "asha@example.com" },
  summary: "Operations lead.",
  experience: [
    { id: "e1", company: "Acme", role: "Analyst", startDate: "Jan 2020", endDate: "Dec 2022", bullets: ["Cut report time by 31%", "Ran weekly reviews"] },
  ],
  skills: ["Excel"],
};
const resume = (extra: Partial<ResumeData>): ResumeData => ({ ...base, ...extra });
const ids = (r: ResumeData) => runResumeChecks(r).map((f) => f.id);
const only = (r: ResumeData, findingId: string) => fixesFor(r).find((f) => f.findingId === findingId);

describe("tool names", () => {
  const r = resume({
    skills: ["Javascript", "Excel"],
    skillGroups: [{ id: "g1", name: "Web", skills: ["Javascript"] }],
    projects: [{ id: "p1", name: "App", description: "", tech: "React · Javascript · Firebase" }],
  });
  it("fixes the name in the skills list, the groups and the project tech line, nothing else", () => {
    const fix = only(r, "tool-names")!;
    expect(fix.kind).toBe("rule");
    const next = applyEdits(r, fix.edits)!;
    expect(next.skills).toEqual(["JavaScript", "Excel"]);
    expect(next.skillGroups?.[0].skills).toEqual(["JavaScript"]);
    expect(next.projects?.[0].tech).toBe("React · JavaScript · Firebase");
    expect(next.summary).toBe(r.summary);
    expect(ids(next)).not.toContain("tool-names");
  });
  it("never lowers the score", () => {
    const next = applyEdits(r, only(r, "tool-names")!.edits)!;
    expect(scoreResumeQuality(next).overall).toBeGreaterThanOrEqual(scoreResumeQuality(r).overall);
  });
});

describe("review fixes", () => {
  it("two misspelt tools in one project tech line fix together and apply", () => {
    const r = resume({ projects: [{ id: "p1", name: "App", description: "", tech: "Javascript · Pyhton · Firebase" }] });
    const fix = only(r, "tool-names")!;
    expect(fix.edits.filter((e) => e.loc.t === "tech")).toHaveLength(1);
    expect(applyEdits(r, fix.edits)!.projects?.[0].tech).toBe("JavaScript · Python · Firebase");
  });
  it("does not rename a tool into a duplicate", () => {
    const r = resume({ skills: ["Javascript", "JavaScript"] });
    const fix = only(r, "tool-names");
    expect(fix === undefined || applyEdits(r, fix.edits)!.skills.filter((s) => s === "JavaScript").length === 1).toBe(true);
  });
  it("UK respelling leaves valid -ize and license alone", () => {
    expect(respell("optimize the license", "UK")).toBe("optimize the license");
    expect(respell("analyze the color", "UK")).toBe("analyse the colour");
  });
  it("the same figure under two projects gets two different labels", () => {
    const r = resume({
      experience: [{ id: "e9", company: "Acme", role: "A", startDate: "Jan 2020", endDate: "Dec 2020", bullets: ["Grew sales by 34%"] }],
      projects: [
        { id: "p1", name: "A", description: "", bullets: ["Cut cost by 34%"] },
        { id: "p2", name: "B", description: "", bullets: ["Raised leads 34%"] },
      ],
    });
    const labels = only(r, "repeated-metric")!.choices!.map((c) => c.label);
    expect(new Set(labels).size).toBe(labels.length);
  });
});

describe("country spelling", () => {
  const r = resume({
    summary: "We organised the colour review at the Centre for Policy.",
    customization: { market: "US" },
  });
  it("only swaps the listed lowercase words", () => {
    const fix = only(r, "country-spelling")!;
    const next = applyEdits(r, fix.edits)!;
    expect(next.summary).toBe("We organized the color review at the Centre for Policy.");
    expect(respell("analysed the centre and colours", "US")).toBe("analyzed the center and colors");
    expect(respell("analyzed the center and colors", "UK")).toBe("analysed the centre and colours");
  });
  it("has a partner for every word the check looks for", () => {
    const uk = new Set(SPELLING_PAIRS.map(([b]) => b));
    const us = new Set(SPELLING_PAIRS.map(([, a]) => a));
    expect(BRITISH.filter((w) => !uk.has(w))).toEqual([]);
    expect(AMERICAN.filter((w) => !us.has(w))).toEqual([]);
  });
});

describe("personal details", () => {
  const r = resume({
    contact: { fullName: "A", email: "a@example.com", dateOfBirth: "1999-01-01", nationality: "Indian" },
    customization: { market: "US", showPhoto: true, photoDataUrl: "data:image/png;base64,AAAA" },
  });
  it("removes them, and Undo puts them back exactly", () => {
    const fix = only(r, "country-personal")!;
    const next = applyEdits(r, fix.edits)!;
    expect(next.contact.dateOfBirth).toBe("");
    expect(next.contact.nationality).toBe("");
    expect(next.customization?.showPhoto).toBe(false);
    expect(next.customization?.photoDataUrl).toBe("data:image/png;base64,AAAA"); // photo kept, just hidden
    expect(undoEdits(next, fix.edits)).toEqual(r);
  });
});

describe("years claimed", () => {
  it("changes only the number, to what the dates add up to", () => {
    const r = resume({ summary: "Operations lead with 10 years of experience in retail." });
    const fix = only(r, "years-vs-dates")!;
    expect(applyEdits(r, fix.edits)!.summary).toBe("Operations lead with 3 years of experience in retail.");
  });
  it("offers no fix when the real figure is under two years (avoids '1 years')", () => {
    const r = resume({
      summary: "Lead with 9 years of experience.",
      experience: [{ ...base.experience[0], startDate: "Jan 2022", endDate: "Jun 2022" }],
    });
    expect(only(r, "years-vs-dates")).toBeUndefined();
  });
});

describe("same figure twice", () => {
  const r = resume({
    experience: [
      { id: "e1", company: "Acme", role: "A", startDate: "Jan 2020", endDate: "Dec 2020", bullets: ["Grew sales by 34%"] },
      { id: "e2", company: "Beta", role: "B", startDate: "Jan 2021", endDate: "Dec 2022", bullets: ["Raised leads by 34% and cut cost 12%"] },
    ],
  });
  it("lets the person choose where it stays; the other gets a [X] blank, not a guess", () => {
    const fix = only(r, "repeated-metric")!;
    expect(fix.kind).toBe("choice");
    expect(fix.choices).toHaveLength(2);
    const keepFirst = applyEdits(r, fix.choices![0].edits)!;
    expect(keepFirst.experience[0].bullets[0]).toBe("Grew sales by 34%");
    expect(keepFirst.experience[1].bullets[0]).toBe("Raised leads by [X]% and cut cost 12%");
    expect(ids(keepFirst)).not.toContain("repeated-metric");
  });
});

describe("duty bullets (AI)", () => {
  const r = resume({
    experience: [{ ...base.experience[0], bullets: ["Responsible for the weekly reports", "Helped with onboarding", "Ran audits"] }],
  });
  it("makes one AI fix per duty bullet and writes nothing itself", () => {
    const fixes = fixesFor(r).filter((f) => f.findingId === "duty-bullets");
    expect(fixes).toHaveLength(2);
    expect(fixes.every((f) => f.kind === "ai" && f.edits.length === 0)).toBe(true);
    expect(fixes[0].ai).toMatchObject({ bullet: "Responsible for the weekly reports", role: "Analyst" });
  });
  it("skips bullets that carry bold or italic marks", () => {
    const marked = resume({ experience: [{ ...base.experience[0], bullets: ["<b>Responsible for</b> reports", "Helped with onboarding"] }] });
    expect(fixesFor(marked).filter((f) => f.findingId === "duty-bullets").length).toBeLessThanOrEqual(1);
  });
  it("never invents facts: tools, numbers and awards from the model are dropped or blanked", async () => {
    replies.push(
      JSON.stringify([
        "Built weekly reports in Python for the ops team",
        "Cut weekly report time by 40%",
        "Won an award for the weekly reports",
        "Produced the weekly reports",
        "Prepared weekly reports, saving [X] hours a week",
      ])
    );
    const { value } = await polishBullet({ roughBullet: "Responsible for the weekly reports", role: "Analyst", grounded: true });
    expect(value.join(" ")).not.toMatch(/Python|40%|award/i);
    expect(value.length).toBeGreaterThan(0);
  });
});

describe("never changes silently, always can undo", () => {
  const r = resume({ skills: ["Javascript"] });
  const fix = only(r, "tool-names")!;
  it("fixesFor does not touch the resume", () => {
    const copy = structuredClone(r);
    fixesFor(r);
    expect(r).toEqual(copy);
  });
  it("refuses a stale fix: the text changed after the card was shown", () => {
    expect(applyEdits({ ...r, skills: ["JS Frameworks"] }, fix.edits)).toBeNull();
  });
  it("Undo restores exactly, and refuses if those places were edited since", () => {
    const next = applyEdits(r, fix.edits)!;
    expect(undoEdits(next, fix.edits)).toEqual(r);
    expect(undoEdits({ ...next, skills: ["Something else"] }, fix.edits)).toBeNull();
  });
  it("one failing edit changes nothing at all", () => {
    const bad: Edit[] = [...fix.edits, { loc: { t: "summary" }, before: "not the summary", after: "x" }];
    expect(applyEdits(r, bad)).toBeNull();
  });
});

describe("AI fix limits (owner table, 2026-11-22)", () => {
  it("free 1 for life, legacy 3 a month, Pro 100 a month", () => {
    expect(PLAN_LIMITS.free.aiFixes).toBe(1);
    expect(PLAN_LIMITS.free_legacy.aiFixes).toBe(3);
    expect(PLAN_LIMITS.pro.aiFixes).toBe(100);
    expect(canUseAiFix("free", 0).allowed).toBe(true);
    const r = canUseAiFix("free", 1);
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).not.toMatch(/[₹$£€]/);
    expect(canUseAiFix("pro", 99).allowed).toBe(true);
    expect(canUseAiFix("pro", 100).allowed).toBe(false);
  });
  it("daily caps 1 / 3 / 20", () => {
    expect(DAILY_LIMITS.free.fix).toBe(1);
    expect(DAILY_LIMITS.free_legacy.fix).toBe(3);
    expect(DAILY_LIMITS.pro.fix).toBe(20);
    expect(canUseAiToday("pro", "fix", 20, 0).allowed).toBe(false);
  });
});
