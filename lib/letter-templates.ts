import type { LimitTier } from "./limits";
import type { Market } from "./market";
import type { ResumeData } from "./types";

/**
 * Letter designs for cover letters and resignation letters, separate from the resume templates. Two are free,
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

export type LetterKind = "cover" | "resignation";

export function letterFileName(resume: ResumeData, ext: "pdf" | "docx", kind: LetterKind = "cover", name?: string): string {
  const base = (name || resume.contact.fullName || "").replace(/[^\p{L}\p{N}]+/gu, "_").replace(/^_|_$/g, "");
  const suffix = kind === "resignation" ? "Resignation_Letter" : "Cover_Letter";
  return `${base ? `${base}_` : ""}${suffix}.${ext}`;
}

/** Who the letter is addressed to, under the date. Cover letters: the hiring team; resignations: the manager. */
export function letterRecipient(kind: LetterKind, company?: string, manager?: string): string {
  const c = company?.trim() ?? "";
  if (kind === "resignation") return [manager?.trim(), c].filter(Boolean).join("\n");
  return c ? `Hiring Team\n${c}` : "";
}

/** Reads the shared letter fields from a request body, with safe lengths. */
export function letterRequest(body: unknown) {
  const b = (body ?? {}) as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const kind: LetterKind = b.kind === "resignation" ? "resignation" : "cover";
  return {
    kind,
    letter: str(b.letter, 8000),
    design: b.design,
    company: str(b.company, 120),
    manager: str(b.manager, 120),
    name: str(b.name, 120),
    headline: str(b.headline, 120),
    inline: b.inline === true,
  };
}
