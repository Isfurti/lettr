import type { LimitTier } from "./limits";
import type { Market } from "./market";
import type { ResumeData } from "./types";

/**
 * Cover letter designs, separate from the resume templates. Two are free,
 * the rest are Pro, the same split as resume templates. Every design uses
 * the resume's name, contact details and accent colour.
 */
export const LETTER_TEMPLATES = [
  { id: "classic", name: "Classic", blurb: "Centred serif heading, timeless", free: true },
  { id: "modern", name: "Modern", blurb: "Name in your colour, clean sans", free: true },
  { id: "minimal", name: "Minimal", blurb: "Quiet, lots of white space", free: false },
  { id: "bold", name: "Bold", blurb: "Full-width colour band", free: false },
  { id: "elegant", name: "Elegant", blurb: "Display serif, double rule", free: false },
  { id: "executive", name: "Executive", blurb: "Strong rule, details on the right", free: false },
  { id: "sidebar", name: "Sidebar", blurb: "Contact details in a colour column", free: false },
  { id: "editorial", name: "Editorial", blurb: "Magazine-style serif and sans", free: false },
  { id: "monogram", name: "Monogram", blurb: "Your initials in a circle", free: false },
  { id: "corporate", name: "Corporate", blurb: "Thin top line, date on the right", free: false },
] as const;

export type LetterTemplateId = (typeof LETTER_TEMPLATES)[number]["id"];

export function isLetterTemplateId(v: unknown): v is LetterTemplateId {
  return typeof v === "string" && LETTER_TEMPLATES.some((t) => t.id === v);
}

export function canUseLetterTemplate(tier: LimitTier, id: string): { allowed: boolean; reason?: string } {
  const t = LETTER_TEMPLATES.find((x) => x.id === id);
  if (!t) return { allowed: false, reason: "Unknown letter design." };
  if (tier === "pro" || t.free) return { allowed: true };
  return {
    allowed: false,
    reason: `The ${t.name} letter design is a Pro feature. Upgrade to unlock every design, or pick Classic or Modern.`,
  };
}

/** The letter split into paragraphs (blank lines), keeping single line breaks inside a paragraph. */
export function letterParagraphs(text: string): string[] {
  return text
    .replace(/\r\n/g, "\n")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Today's date the way the market writes it: "November 14, 2026" in the USA, "14 November 2026" elsewhere. */
export function letterDate(market: Market | null, d: Date = new Date()): string {
  return d.toLocaleDateString(market === "US" ? "en-US" : "en-GB", { day: "numeric", month: "long", year: "numeric" });
}

/** The current or latest job title, used under the name. */
export function letterHeadline(resume: ResumeData): string {
  const current = resume.experience.find((e) => /present|current|now/i.test(e.endDate)) ?? resume.experience[0];
  return current?.role?.trim() ?? "";
}

/** Initials for the Monogram design, e.g. "Asha Rao" → "AR". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export function letterFileName(resume: ResumeData, ext: "pdf" | "docx"): string {
  const base = (resume.contact.fullName || "cover_letter").replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "");
  return `${base || "cover_letter"}_Cover_Letter.${ext}`;
}
