import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { cleanGroup, groupExperience, MAX_GROUP_LENGTH } from "@/lib/resume-sections";
import { applyLayout } from "@/lib/layout";
import { GroupHeading } from "@/components/templates/GroupHeading";
import { generateResumeDocx } from "@/lib/generate-docx";
import { emptyResume } from "@/lib/types";
import type { ExperienceEntry, ResumeData } from "@/lib/types";

const job = (id: string, group?: string): ExperienceEntry => ({ id, company: `Co ${id}`, role: `Role ${id}`, startDate: "Jan 2020", endDate: "Dec 2021", bullets: ["Did a thing"], group });
const resume = (experience: ExperienceEntry[]): ResumeData => ({ ...emptyResume, contact: { fullName: "A B", email: "a@b.co" }, experience });

describe("groupExperience", () => {
  it("returns the same list when nobody has a heading", () => {
    const list = [job("a"), job("b")];
    expect(groupExperience(list)).toBe(list);
    expect(groupExperience([job("a", "  ")])).toEqual([job("a", "  ")]);
  });
  it("puts ungrouped first, then each heading together in order, stamping the first job of each", () => {
    const out = groupExperience([job("a", "Overseas experience"), job("b"), job("c", "overseas  experience"), job("d", "Volunteer"), job("e")]);
    expect(out.map((j) => j.id)).toEqual(["b", "e", "a", "c", "d"]);
    expect(out.find((j) => j.id === "a")?.groupHeading).toBe("Overseas experience");
    expect(out.find((j) => j.id === "c")?.groupHeading).toBeUndefined();
    expect(out.find((j) => j.id === "d")?.groupHeading).toBe("Volunteer");
    expect(out.find((j) => j.id === "b")?.groupHeading).toBeUndefined();
  });
  it("does not change the saved list", () => {
    const list = [job("a", "X"), job("b")];
    groupExperience(list);
    expect(list.map((j) => j.id)).toEqual(["a", "b"]);
    expect(list[0].groupHeading).toBeUndefined();
  });
  it("cleans and caps headings", () => {
    expect(cleanGroup("  a \n b ")).toBe("a b");
    expect(cleanGroup("x".repeat(100))).toHaveLength(MAX_GROUP_LENGTH);
    expect(cleanGroup(undefined)).toBe("");
  });
});

describe("rendering", () => {
  it("applyLayout reorders for every print path and hides the heading when experience is hidden", () => {
    const r = applyLayout(resume([job("a", "Overseas experience"), job("b")]));
    expect(r.experience.map((j) => j.id)).toEqual(["b", "a"]);
    expect(r.experience[1].groupHeading).toBe("Overseas experience");
    expect(applyLayout({ ...resume([job("a", "X")]), customization: { hiddenSections: ["experience"] } as never }).experience).toEqual([]);
  });
  it("GroupHeading prints only on the first job of a group", () => {
    const [b, a] = applyLayout(resume([job("a", "Overseas experience"), job("b")])).experience;
    expect(renderToStaticMarkup(<GroupHeading exp={a} />)).toContain("Overseas experience");
    expect(renderToStaticMarkup(<GroupHeading exp={b} />)).toBe("");
  });
  it("Word export contains the heading once", async () => {
    const buf = await generateResumeDocx(resume([job("a", "Overseas experience"), job("c", "Overseas experience")]));
    const JSZip = (await import("jszip")).default;
    const xml = await (await JSZip.loadAsync(buf)).file("word/document.xml")!.async("string");
    expect(xml.split("OVERSEAS EXPERIENCE").length - 1).toBe(1);
  });
});
