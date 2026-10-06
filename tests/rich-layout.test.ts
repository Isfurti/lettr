import { describe, it, expect } from "vitest";
import { parseRich, stripRich, toggleMark, plainResume } from "@/lib/rich-text";
import { applyLayout, formatResumeDate, layoutScale, moveSection, pageSize, sectionOrder } from "@/lib/layout";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import { scoreResumeQuality } from "@/lib/resume-score";

describe("bold / italic / underline", () => {
  it("parses nested and unclosed tags safely", () => {
    expect(parseRich("a <b>bold <i>both</i></b> c")).toEqual([
      { text: "a ", b: false, i: false, u: false },
      { text: "bold ", b: true, i: false, u: false },
      { text: "both", b: true, i: true, u: false },
      { text: " c", b: false, i: false, u: false },
    ]);
    expect(parseRich("x </b> <u>y")).toEqual([
      { text: "x  ", b: false, i: false, u: false },
      { text: "y", b: false, i: false, u: true },
    ]);
    expect(parseRich("C++ and 5 < 6")).toEqual([{ text: "C++ and 5 < 6", b: false, i: false, u: false }]);
  });
  it("wraps and unwraps a selection", () => {
    const on = toggleMark("Led a team", 0, 3, "b");
    expect(on).toEqual({ value: "<b>Led</b> a team", start: 3, end: 6 });
    expect(toggleMark(on.value, on.start, on.end, "b")).toEqual({ value: "Led a team", start: 0, end: 3 });
    expect(toggleMark("<u>Led</u> a team", 0, 10, "u").value).toBe("Led a team");
    expect(toggleMark("ab", 1, 1, "i")).toEqual({ value: "a<i></i>b", start: 4, end: 4 });
  });
  it("is invisible to scoring", () => {
    const r = { ...SAMPLE_RESUME, summary: `<b>${SAMPLE_RESUME.summary}</b>` };
    expect(stripRich(r.summary)).toBe(SAMPLE_RESUME.summary);
    expect(plainResume(r).summary).toBe(SAMPLE_RESUME.summary);
    expect(scoreResumeQuality(r).overall).toBe(scoreResumeQuality(SAMPLE_RESUME).overall);
  });
});

describe("layout", () => {
  it("fixes up saved section orders", () => {
    expect(sectionOrder(undefined)[0]).toBe("summary");
    const o = sectionOrder({ sectionOrder: ["skills", "summary", "bogus", "skills"] });
    expect(o.slice(0, 2)).toEqual(["skills", "summary"]);
    expect(o).toHaveLength(8);
    expect(moveSection(o, "skills", -1)).toEqual(o);
    expect(moveSection(o, "skills", 1).slice(0, 2)).toEqual(["summary", "skills"]);
  });
  it("formats dates and leaves unknown ones alone", () => {
    expect(formatResumeDate("Jan 2024", "long")).toBe("January 2024");
    expect(formatResumeDate("Sep 2021", "numeric")).toBe("09/2021");
    expect(formatResumeDate("Sep 2021", "year")).toBe("2021");
    expect(formatResumeDate("Present", "long")).toBe("Present");
    expect(formatResumeDate("Summer 2019", "numeric")).toBe("Summer 2019");
  });
  it("hides sections and restyles dates", () => {
    const d = applyLayout({ ...SAMPLE_RESUME, customization: { hiddenSections: ["summary", "languages"], dateStyle: "year" } });
    expect(d.summary).toBe("");
    expect(d.languages).toEqual([]);
    expect(d.experience[0].startDate).toMatch(/^\d{4}$/);
  });
  it("clamps spacing and defaults to A4", () => {
    expect(layoutScale({ scale: 0.2 })).toBe(0.75);
    expect(layoutScale({ scale: 3 })).toBe(1.1);
    expect(layoutScale({})).toBe(1);
    expect(pageSize({})).toBe("A4");
    expect(pageSize({ pageSize: "LETTER" })).toBe("LETTER");
  });
});
