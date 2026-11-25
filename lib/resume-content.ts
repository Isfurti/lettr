import type { ResumeData } from "@/lib/types";

const has = (v: unknown) => typeof v === "string" && v.trim().length > 0;

/**
 * True when the resume has real text in at least one section beyond the contact details.
 * Empty rows (an added but unfilled job or school) don't count. A resume that fails this
 * shows a score of 0 instead of credit for layout checks that pass on an empty page.
 */
export function resumeHasContent(d: ResumeData): boolean {
  return Boolean(
    has(d.summary) ||
      d.experience?.some((e) => has(e.company) || has(e.role) || e.bullets?.some(has)) ||
      d.education?.some((e) => has(e.school) || has(e.degree)) ||
      d.skills?.some(has) ||
      d.skillGroups?.some((g) => g.skills?.some(has)) ||
      d.projects?.some((p) => has(p.name) || has(p.description) || p.bullets?.some(has)) ||
      d.certifications?.some((c) => has(c.name)) ||
      d.languages?.some(has) ||
      d.achievements?.some(has) ||
      d.customSections?.some((s) => s.items?.some((i) => has(i.title) || has(i.subtitle) || i.bullets?.some(has))),
  );
}
