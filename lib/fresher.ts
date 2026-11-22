import type { SectionKey } from "./layout";
import type { Market } from "./market";
import type { ResumeCustomization, ResumeData } from "./types";

/**
 * The "I have little or no experience" path: a section order that leads with
 * Education, Projects, Skills and Achievements, guided questions that turn
 * coursework, projects, clubs and contests into bullets, and short guidance.
 * Pure functions, so the editor, the route and the tests share one answer.
 */

/** Summary stays on top (a short profile line); then the four sections that carry a first resume. */
export const FRESHER_ORDER: SectionKey[] = [
  "summary",
  "education",
  "projects",
  "skills",
  "achievements",
  "custom",
  "experience",
  "certifications",
  "languages",
];

/** Turns the path on: order changed, nothing hidden or shown that the person had not chosen. The caller keeps the old value for Undo. */
export function applyFresherPath(c: ResumeCustomization | undefined): ResumeCustomization {
  return { ...c, fresher: true, sectionOrder: [...FRESHER_ORDER] };
}

export function isFresher(c: ResumeCustomization | undefined): boolean {
  return c?.fresher === true;
}

export type FresherKind = "coursework" | "project" | "club" | "hackathon" | "competition";

export const FRESHER_KINDS: { id: FresherKind; label: string; namePlaceholder: string; what: string; where: string }[] = [
  { id: "project", label: "College or personal project", namePlaceholder: "Library booking app", what: "What did you build or do?", where: "Projects" },
  { id: "coursework", label: "Coursework or lab", namePlaceholder: "Database Systems course project", what: "What did you build or do?", where: "Projects" },
  { id: "hackathon", label: "Hackathon", namePlaceholder: "Smart India Hackathon 2024", what: "What did your team build, and what was your part?", where: "Projects" },
  { id: "competition", label: "Competition or award", namePlaceholder: "Inter-college quiz, 2nd place", what: "What was it and what did you do?", where: "Achievements" },
  { id: "club", label: "Club or volunteering", namePlaceholder: "Coding club, treasurer", what: "What did you do for the club or cause?", where: "Clubs and activities" },
];

export type FresherAnswers = { kind: FresherKind; name: string; what: string; tools: string; result: string };

export const FRESHER_LIMITS = { name: 120, what: 400, tools: 200, result: 200 } as const;

/** Everything the person typed: the only facts the draft may use. */
export function fresherSource(a: FresherAnswers): string {
  return [a.name, a.what, a.tools, a.result].map((s) => s.trim()).filter(Boolean).join("\n");
}

/** What is missing before a draft can be asked for, or null when ready. */
export function fresherAnswersProblem(a: FresherAnswers): string | null {
  if (a.what.trim().length < 5) return "Tell us in a sentence what you built or did.";
  if (a.name.trim().length < 2) return "Give it a short name.";
  return null;
}

/** Puts the chosen bullet where it belongs. Returns a new resume; never touches anything else. */
export function addFresherItem(data: ResumeData, a: FresherAnswers, bullet: string, newId: () => string): ResumeData {
  const text = bullet.trim();
  if (!text) return data;
  if (a.kind === "competition") {
    return { ...data, achievements: [...(data.achievements ?? []), `${a.name.trim()}: ${text}`.replace(/^: /, "")] };
  }
  if (a.kind === "club") {
    const sections = data.customSections ?? [];
    const item = { id: newId(), title: a.name.trim(), subtitle: "", startDate: "", endDate: "", bullets: [text] };
    const at = sections.findIndex((s) => s.heading.trim().toLowerCase() === "clubs and activities");
    if (at >= 0) {
      const next = sections.map((s, i) => (i === at ? { ...s, items: [...s.items, item] } : s));
      return { ...data, customSections: next };
    }
    return { ...data, customSections: [...sections, { id: newId(), heading: "Clubs and activities", items: [item] }] };
  }
  const tech = a.tools.trim();
  return {
    ...data,
    projects: [...(data.projects ?? []), { id: newId(), name: a.name.trim(), description: "", tech: tech || undefined, bullets: [text] }],
  };
}

export type FresherTip = { title: string; text: string };

/** Short, plain guidance. Static text; the market only changes the lines that differ by country. */
export function fresherGuidance(market: Market | null): FresherTip[] {
  const photo =
    market === "US" || market === "UK"
      ? "Leave your photo, date of birth and nationality off. Employers here do not expect them."
      : market === "IN" || market === "EU" || market === "GULF"
        ? "A photo and personal details are optional. Add them only if the job post or your country's norm asks."
        : "Add a photo or personal details only if the job post asks for them.";
  return [
    { title: "Length", text: "One page. Recruiters read a first resume quickly." },
    { title: "Put first", text: "Education, then Projects, Skills and Achievements. Move Experience (internships, volunteering) after them." },
    { title: "Leave out", text: `A hobbies list, a long objective statement, skills you cannot talk about. ${photo}` },
    { title: "Turn work into bullets", text: "For each project, club or contest: what you did, the tools you used and the result or number. Use the prompts below to draft one." },
  ];
}
