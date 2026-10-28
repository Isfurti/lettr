import { describe, it, expect } from "vitest";
import { endsBeforeStart, isInFuture, datePairProblem, parseResumeDate } from "@/lib/resume-dates";
import { analyzeAts } from "@/lib/ats-analyst";
import { SAMPLE_RESUME } from "@/lib/sample-resume";

const NOW = new Date("2026-10-28T12:00:00+05:30");

describe("resume dates follow the calendar", () => {
  it("reads the formats people type", () => {
    expect(parseResumeDate("Jan 2024")).toEqual({ year: 2024, month: 0 });
    expect(parseResumeDate("September 2019")).toEqual({ year: 2019, month: 8 });
    expect(parseResumeDate("03/2022")).toEqual({ year: 2022, month: 2 });
    expect(parseResumeDate("2020")).toEqual({ year: 2020, month: null });
    expect(parseResumeDate("Summer 2019")).toBeNull();
  });

  it("catches an end before its start", () => {
    expect(endsBeforeStart("Jan 2031", "Mar 2026", NOW)).toBe(true);
    expect(endsBeforeStart("Jul 2022", "Jun 2026", NOW)).toBe(false);
    expect(endsBeforeStart("Mar 2024", "Feb 2024", NOW)).toBe(true);
    expect(endsBeforeStart("2022", "2022", NOW)).toBe(false);
    expect(endsBeforeStart("Jan 2020", "Present", NOW)).toBe(false);
    expect(endsBeforeStart("", "Mar 2026", NOW)).toBe(false);
  });

  it("knows what hasn't happened yet", () => {
    expect(isInFuture("Jan 2031", NOW)).toBe(true);
    expect(isInFuture("Oct 2026", NOW)).toBe(false);
    expect(isInFuture("Present", NOW)).toBe(false);
  });

  it("allows an expected graduation date, but not a future job end", () => {
    expect(datePairProblem("Jul 2022", "Jun 2027", { endMayBeFuture: true }, NOW)).toBeNull();
    expect(datePairProblem("Jul 2022", "Jun 2027", {}, NOW)).toMatch(/hasn't happened/);
    expect(datePairProblem("Jan 2031", "Mar 2026", { endMayBeFuture: true }, NOW)).toMatch(/before the start/);
  });

  it("flags dates in the wrong order in the ATS score", () => {
    const resume = structuredClone(SAMPLE_RESUME);
    resume.education[0] = { ...resume.education[0], startDate: "Jan 2031", endDate: "Mar 2026" };
    const dates = analyzeAts(resume, "classic").categories.flatMap((c) => c.checks).find((c) => c.id === "dates");
    expect(dates?.status).toBe("fail");
    expect(dates?.section).toBe("education");
  });
});
