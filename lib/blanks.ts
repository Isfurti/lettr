import { extraSections, type ResumeData } from "./types";
import { stripRich } from "./rich-text";

/**
 * AI rewrites leave [X]-style blanks ("Grew sales by [X]%") for facts only
 * the person knows. A blank left in a downloaded resume looks careless, so
 * the builder points them out before a download. Same shape as the ATS
 * analyst's check (lib/ats-analyst.ts): square brackets around a short phrase.
 */
const BLANK_PATTERN = /\[[^\]\n]{1,40}\]/;

export type BlankSection = "summary" | "experience" | "projects" | "achievements";
export type BlankSpot = { section: BlankSection; text: string };

/** Every line of the resume that still has a blank to fill in, in the order they appear. */
export function findBlanks(data: ResumeData): BlankSpot[] {
  const spots: BlankSpot[] = [];
  const check = (section: BlankSection, raw: string | undefined) => {
    const text = stripRich(raw ?? "");
    if (BLANK_PATTERN.test(text)) spots.push({ section, text });
  };
  check("summary", data.summary);
  for (const exp of data.experience ?? []) for (const b of exp.bullets ?? []) check("experience", b);
  const extra = extraSections(data);
  for (const p of extra.projects) check("projects", p.description);
  for (const a of extra.achievements) check("achievements", a);
  return spots;
}
