import type { Market } from "./market";
import type { ResumeData } from "./types";

type Contact = ResumeData["contact"];

/** Optional personal details some markets expect on a CV. */
export type PersonalField = "nationality" | "visaStatus" | "dateOfBirth";

export const PERSONAL_FIELDS: { key: PersonalField; label: string; placeholder: string; prefix: string }[] = [
  { key: "nationality", label: "Nationality", placeholder: "e.g. Indian", prefix: "Nationality" },
  { key: "visaStatus", label: "Visa status", placeholder: "e.g. UAE residence visa (transferable)", prefix: "Visa" },
  { key: "dateOfBirth", label: "Date of birth", placeholder: "e.g. 12 March 1995", prefix: "Date of birth" },
];

/**
 * Which personal details to offer for a market. Gulf employers often expect
 * nationality, visa status and date of birth; elsewhere they're left out, so
 * nobody adds them by mistake. Fields someone already filled in always show.
 */
export function personalFieldsFor(market: Market | null, contact: Contact): PersonalField[] {
  const offered: PersonalField[] = market === "GULF" ? ["nationality", "visaStatus", "dateOfBirth"] : [];
  const filled = PERSONAL_FIELDS.map((f) => f.key).filter((k) => contact[k]?.trim());
  return PERSONAL_FIELDS.map((f) => f.key).filter((k) => offered.includes(k) || filled.includes(k));
}

/** The pieces of the contact line, in order, as every template prints them. */
export function contactParts(contact: Contact): string[] {
  const base = [contact.email, contact.phone, contact.location, contact.linkedin, contact.website];
  const personal = PERSONAL_FIELDS.map((f) => {
    const v = contact[f.key]?.trim();
    return v ? `${f.prefix}: ${v}` : "";
  });
  return [...base, ...personal].filter((p): p is string => Boolean(p && p.trim()));
}

/* ---------- Language levels (CEFR) ---------- */

export const LANGUAGE_LEVELS = ["Native", "C2", "C1", "B2", "B1", "A2", "A1"] as const;

/** "German (B2)" → { name: "German", level: "B2" }. Any other text in brackets is kept as the level. */
export function splitLanguage(entry: string): { name: string; level: string } {
  const m = entry.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
  return m ? { name: m[1].trim(), level: m[2].trim() } : { name: entry.trim(), level: "" };
}

export function joinLanguage(name: string, level: string): string {
  return level ? `${name} (${level})` : name;
}

/** Adds a skill unless it's already listed (ignoring case). */
export function addSkill(skills: string[], keyword: string): string[] {
  const k = keyword.trim();
  if (!k || skills.some((s) => s.trim().toLowerCase() === k.toLowerCase())) return skills;
  return [...skills, k];
}
