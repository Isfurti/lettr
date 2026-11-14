import type { EarlierRole, EducationEntry, ExperienceEntry, ResumeData, SkillGroup } from "./types";

// Helpers for promotions, grouped skills, project details and education
// grade/location, shared by the editor, every template, Word export and ATS.

/** Earlier titles at this company that have a name. */
export function earlierRoles(exp: ExperienceEntry): EarlierRole[] {
  return (exp.earlierRoles ?? []).filter((r) => r.role.trim());
}

/** "Project Manager · 2010 – 2019" */
export function earlierRoleLine(r: EarlierRole): string {
  const dates = [r.startDate, r.endDate].filter((d) => d && d.trim()).join(" – ");
  return dates ? `${r.role.trim()} · ${dates}` : r.role.trim();
}

/** Every title held at this company, current first. */
export function allRoleTitles(exp: ExperienceEntry): string[] {
  return [exp.role, ...earlierRoles(exp).map((r) => r.role)].filter((t) => t.trim());
}

/** "University of Roehampton, London" */
export function schoolWithLocation(e: EducationEntry): string {
  const loc = e.location?.trim();
  if (!loc) return e.school;
  return e.school.trim() ? `${e.school}, ${loc}` : loc;
}

/** "B.Tech, Computer Science · CGPA 8.4/10" */
export function degreeWithGrade(e: EducationEntry): string {
  const grade = e.grade?.trim();
  if (!grade) return e.degree;
  return e.degree.trim() ? `${e.degree} · ${grade}` : grade;
}

function dedupe(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of list) {
    const t = s.trim();
    const k = t.toLowerCase();
    if (!t || seen.has(k)) continue;
    seen.add(k);
    out.push(t);
  }
  return out;
}

/** Groups that have at least one skill. */
export function filledSkillGroups(data: Pick<ResumeData, "skillGroups">): SkillGroup[] {
  return (data.skillGroups ?? []).filter((g) => g.skills.some((s) => s.trim()));
}

/**
 * The skills as printed when they're grouped: one "Label: a, b" line per group,
 * then "Other: …" for any skill not in a group (e.g. added from the ATS tab).
 * Null when the resume doesn't use groups.
 */
export function skillLines(data: Pick<ResumeData, "skills" | "skillGroups">): string[] | null {
  const groups = filledSkillGroups(data);
  if (groups.length === 0) return null;
  const inGroups = new Set(groups.flatMap((g) => g.skills.map((s) => s.trim().toLowerCase())));
  const lines = groups.map((g) => {
    const items = dedupe(g.skills).join(", ");
    return g.name.trim() ? `${g.name.trim()}: ${items}` : items;
  });
  const other = dedupe(data.skills.filter((s) => !inGroups.has(s.trim().toLowerCase())));
  if (other.length) lines.push(`Other: ${other.join(", ")}`);
  return lines;
}

/** Skills as one string: grouped lines on separate lines, otherwise joined with `sep`. */
export function joinSkills(data: Pick<ResumeData, "skills" | "skillsGrouped">, sep: string): string {
  return data.skills.join(data.skillsGrouped ? "\n" : sep);
}

/**
 * Save new groups and keep the flat `skills` list in step: every grouped skill,
 * plus any skill that was outside the old groups (so nothing added elsewhere is lost).
 */
export function withSkillGroups(data: ResumeData, groups: SkillGroup[]): ResumeData {
  const oldGrouped = new Set((data.skillGroups ?? []).flatMap((g) => g.skills.map((s) => s.trim().toLowerCase())));
  const extras = data.skills.filter((s) => !oldGrouped.has(s.trim().toLowerCase()));
  return { ...data, skillGroups: groups, skills: dedupe([...groups.flatMap((g) => g.skills), ...extras]) };
}

/** Project bullet points that have text. */
export function projectBullets(p: { bullets?: string[] }): string[] {
  return (p.bullets ?? []).filter((b) => b.trim());
}

/** "Senior Project Manager (earlier: Project Manager, Production Assistant)" - for AI prompts. */
export function roleLabel(exp: ExperienceEntry): string {
  const earlier = earlierRoles(exp).map((r) => r.role.trim());
  return earlier.length ? `${exp.role} (earlier: ${earlier.join(", ")})` : exp.role;
}
