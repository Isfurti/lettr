import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import { ResumePreview } from "@/components/ResumeEditor";
import { generateResumeDocx } from "@/lib/generate-docx";
import { applyLayout } from "@/lib/layout";
import { scoreResumeAgainstJob } from "@/lib/ats-score";
import { normalizeExtractedResume } from "@/lib/ai";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import { TEMPLATE_IDS } from "@/lib/templates";
import {
  allRoleTitles,
  degreeWithGrade,
  earlierRoleLine,
  joinSkills,
  roleLabel,
  schoolWithLocation,
  skillLines,
  withSkillGroups,
} from "@/lib/resume-sections";
import type { ResumeData } from "@/lib/types";

const full: ResumeData = {
  ...SAMPLE_RESUME,
  experience: SAMPLE_RESUME.experience.map((e, i) =>
    i === 0
      ? {
          ...e,
          earlierRoles: [
            { id: "r1", role: "Project Manager", startDate: "2010-01", endDate: "2019-01" },
            { id: "r2", role: "Production Assistant", startDate: "2008-01", endDate: "2010-01" },
          ],
        }
      : e
  ),
  education: SAMPLE_RESUME.education.map((e, i) => (i === 0 ? { ...e, grade: "CGPA 8.4/10", location: "Pune" } : e)),
  skills: ["React", "Next.js", "PostgreSQL", "Figma"],
  skillGroups: [
    { id: "g1", name: "Frontend", skills: ["React", "Next.js"] },
    { id: "g2", name: "Databases", skills: ["PostgreSQL"] },
  ],
  projects: [{ id: "p1", name: "NeuroVault", link: "github.com/x/nv", description: "", tech: "Next.js · pgvector", bullets: ["Built a RAG pipeline"] }],
};

describe("resume section helpers", () => {
  it("formats earlier roles and titles", () => {
    expect(earlierRoleLine({ id: "x", role: "PM", startDate: "2010", endDate: "2019" })).toBe("PM · 2010 – 2019");
    expect(earlierRoleLine({ id: "x", role: "PM", startDate: "", endDate: "" })).toBe("PM");
    expect(allRoleTitles(full.experience[0])).toEqual([full.experience[0].role, "Project Manager", "Production Assistant"]);
    expect(roleLabel(full.experience[0])).toContain("(earlier: Project Manager, Production Assistant)");
  });

  it("adds location and grade to education", () => {
    expect(schoolWithLocation({ id: "e", school: "IIT", degree: "", startDate: "", endDate: "", location: "Delhi" })).toBe("IIT, Delhi");
    expect(degreeWithGrade({ id: "e", school: "", degree: "B.Tech", startDate: "", endDate: "", grade: "72%" })).toBe("B.Tech · 72%");
    expect(degreeWithGrade({ id: "e", school: "", degree: "B.Tech", startDate: "", endDate: "" })).toBe("B.Tech");
  });

  it("prints grouped skills with an Other line for loose skills", () => {
    expect(skillLines(full)).toEqual(["Frontend: React, Next.js", "Databases: PostgreSQL", "Other: Figma"]);
    expect(skillLines({ skills: ["A"], skillGroups: [] })).toBeNull();
    const laid = applyLayout(full);
    expect(laid.skillsGrouped).toBe(true);
    expect(joinSkills(laid, ", ")).toBe("Frontend: React, Next.js\nDatabases: PostgreSQL\nOther: Figma");
    expect(joinSkills({ skills: ["A", "B"] }, ", ")).toBe("A, B");
  });

  it("keeps the flat skills list in step with groups", () => {
    const next = withSkillGroups(full, [{ id: "g1", name: "Frontend", skills: ["React", "Vue"] }]);
    // Next.js and PostgreSQL left the groups so they go; Figma was never grouped so it stays.
    expect(next.skills).toEqual(["React", "Vue", "Figma"]);
  });
});

describe("new fields in every template", () => {
  it.each(TEMPLATE_IDS)("preview %s shows promotions, grade, grouped skills and project details", (template) => {
    const html = renderToStaticMarkup(<ResumePreview data={full} template={template} />);
    expect(html).toContain("Project Manager · ");
    expect(html).toContain("CGPA 8.4/10");
    expect(html).toContain("Pune");
    expect(html).toContain("Frontend: React, Next.js");
    expect(html).toContain("Next.js · pgvector");
    expect(html).toContain("Built a RAG pipeline");
  });

  it.each(TEMPLATE_IDS)("PDF %s renders with the new fields", async (template) => {
    const pdf = await renderToBuffer(ResumePdfDocument({ resume: full, template }));
    expect(pdf.length).toBeGreaterThan(1000);
  }, 30_000);

  it("Word file includes them", async () => {
    const buf = await generateResumeDocx(full);
    expect(buf.length).toBeGreaterThan(1000);
  });
});

describe("ATS and import read the new fields", () => {
  it("counts earlier titles and project tech as resume text", () => {
    const res = scoreResumeAgainstJob(full, "Production Assistant needed. Must know pgvector. pgvector daily.");
    expect(res.matchedKeywords.map((k) => k.toLowerCase())).toContain("pgvector");
  });

  it("imports promotions, grade, location and project details", () => {
    const r = normalizeExtractedResume({
      contact: {},
      experience: [{ role: "Senior PM", company: "X", startDate: "2019", endDate: "Present", bullets: [], earlierRoles: [{ role: "PM", startDate: "2010", endDate: "2019" }] }],
      education: [{ school: "IIT", degree: "B.Tech", grade: "8.1 CGPA", location: "Delhi" }],
      projects: [{ name: "P", tech: "React", bullets: ["Did a thing"] }],
    });
    expect(r.experience[0].earlierRoles?.[0].role).toBe("PM");
    expect(r.education[0].grade).toBe("8.1 CGPA");
    expect(r.education[0].location).toBe("Delhi");
    expect(r.projects?.[0].tech).toBe("React");
    expect(r.projects?.[0].bullets).toEqual(["Did a thing"]);
  });
});
