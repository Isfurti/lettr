import type { ResumeCustomization, ResumeData } from "./types";

/**
 * Layout choices from the builder's Design panel that apply to every
 * template the same way: section order and visibility, date style, page
 * size, spacing (scale) and photo shape. Pure functions, so the preview, the
 * PDF and the Word file all read the same answers.
 */

export const SECTION_KEYS = [
  "summary",
  "experience",
  "education",
  "skills",
  "projects",
  "certifications",
  "achievements",
  "languages",
] as const;

export type SectionKey = (typeof SECTION_KEYS)[number];

export const SECTION_LABELS: Record<SectionKey, string> = {
  summary: "Summary",
  experience: "Experience",
  education: "Education",
  skills: "Skills",
  projects: "Projects",
  certifications: "Certifications",
  achievements: "Achievements",
  languages: "Languages",
};

const isKey = (k: unknown): k is SectionKey => (SECTION_KEYS as readonly unknown[]).includes(k);

/** The user's order, with any missing or unknown sections fixed up (new sections go in their default place). */
export function sectionOrder(c: ResumeCustomization | undefined): SectionKey[] {
  const saved = (c?.sectionOrder ?? []).filter(isKey);
  const unique = [...new Set(saved)];
  for (const k of SECTION_KEYS) {
    if (!unique.includes(k)) {
      const defaultIdx = SECTION_KEYS.indexOf(k);
      // Put it after the last section that comes before it by default.
      let at = 0;
      unique.forEach((u, i) => {
        if (SECTION_KEYS.indexOf(u) < defaultIdx) at = i + 1;
      });
      unique.splice(at, 0, k);
    }
  }
  return unique;
}

export function hiddenSections(c: ResumeCustomization | undefined): SectionKey[] {
  return (c?.hiddenSections ?? []).filter(isKey);
}

/** Moves a section one step up (-1) or down (+1). */
export function moveSection(order: SectionKey[], key: SectionKey, dir: -1 | 1): SectionKey[] {
  const i = order.indexOf(key);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= order.length) return order;
  const next = [...order];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

// ---------- Dates ----------

export type DateStyle = "short" | "long" | "numeric" | "year";

export const DATE_STYLES: { id: DateStyle; label: string; example: string }[] = [
  { id: "short", label: "Jan 2024", example: "Jan 2024" },
  { id: "long", label: "January 2024", example: "January 2024" },
  { id: "numeric", label: "01/2024", example: "01/2024" },
  { id: "year", label: "2024", example: "2024" },
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const LONG = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function parseDate(v: string): { month: number | null; year: string } | null {
  const s = v.trim();
  let m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{4})$/);
  if (m) {
    const idx = MONTHS.findIndex((mo) => mo.toLowerCase() === m![1].slice(0, 3).toLowerCase());
    return idx >= 0 ? { month: idx, year: m[2] } : null;
  }
  m = s.match(/^(\d{1,2})[/-](\d{4})$/);
  if (m && +m[1] >= 1 && +m[1] <= 12) return { month: +m[1] - 1, year: m[2] };
  m = s.match(/^(\d{4})-(\d{1,2})$/);
  if (m && +m[2] >= 1 && +m[2] <= 12) return { month: +m[2] - 1, year: m[1] };
  m = s.match(/^(\d{4})$/);
  if (m) return { month: null, year: m[1] };
  return null;
}

/** Rewrites one stored date ("Jan 2024") in the chosen style. Anything it can't read is left alone. */
export function formatResumeDate(value: string, style: DateStyle | undefined): string {
  if (!value || !style || style === "short") return value;
  const p = parseDate(value);
  if (!p) return value;
  if (style === "year" || p.month === null) return p.year;
  if (style === "long") return `${LONG[p.month]} ${p.year}`;
  return `${String(p.month + 1).padStart(2, "0")}/${p.year}`;
}

// ---------- Page, spacing, photo ----------

export type PageSize = "A4" | "LETTER";

export function pageSize(c: ResumeCustomization | undefined): PageSize {
  return c?.pageSize === "LETTER" ? "LETTER" : "A4";
}

export const MIN_SCALE = 0.75;
export const MAX_SCALE = 1.1;

export const SPACING_PRESETS: { id: string; label: string; scale: number }[] = [
  { id: "compact", label: "Compact", scale: 0.9 },
  { id: "normal", label: "Normal", scale: 1 },
  { id: "roomy", label: "Roomy", scale: 1.06 },
];

/** Text-and-spacing scale: 1 is the template's own size. */
export function layoutScale(c: ResumeCustomization | undefined): number {
  const s = c?.scale;
  if (typeof s !== "number" || !Number.isFinite(s)) return 1;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(s * 100) / 100));
}

export type PhotoShape = "circle" | "rounded" | "square";

export function photoShape(c: ResumeCustomization | undefined): PhotoShape {
  return c?.photoShape === "rounded" || c?.photoShape === "square" ? c.photoShape : "circle";
}

// ---------- Applying it all ----------

/**
 * The resume as templates should draw it: hidden sections emptied and dates
 * in the chosen style. Section order and spacing are handled by the
 * renderers (see Ordered and the PDF transform).
 */
export function applyLayout(data: ResumeData): ResumeData {
  const c = data.customization;
  const hidden = new Set(hiddenSections(c));
  const style = c?.dateStyle;
  const d = (v: string) => formatResumeDate(v, style);
  return {
    ...data,
    summary: hidden.has("summary") ? "" : data.summary,
    experience: hidden.has("experience")
      ? []
      : data.experience.map((e) => ({ ...e, startDate: d(e.startDate), endDate: d(e.endDate) })),
    education: hidden.has("education")
      ? []
      : data.education.map((e) => ({ ...e, startDate: d(e.startDate), endDate: d(e.endDate) })),
    skills: hidden.has("skills") ? [] : data.skills,
    projects: hidden.has("projects") ? [] : data.projects,
    certifications: hidden.has("certifications")
      ? []
      : data.certifications?.map((x) => ({ ...x, date: x.date ? d(x.date) : x.date })),
    achievements: hidden.has("achievements") ? [] : data.achievements,
    languages: hidden.has("languages") ? [] : data.languages,
  };
}

/** The layout settings "Reset to default" clears (colours, fonts and the photo stay). */
export const LAYOUT_KEYS = [
  "sectionOrder",
  "hiddenSections",
  "dateStyle",
  "scale",
  "photoShape",
  "showDividers",
  "indentBullets",
] as const satisfies readonly (keyof ResumeCustomization)[];
