import type { Market } from "./market";
import type { ResumeData } from "./types";

/**
 * Small "how much is right" counters shown in the builder. The ranges match
 * the ATS analyst's checks, so the counter and the score never disagree.
 */
export type Guide = { count: number; text: string; ok: boolean };

export function summaryGuide(summary: string): Guide {
  const count = summary.trim().split(/\s+/).filter(Boolean).length;
  const ok = count >= 30 && count <= 90;
  return { count, ok, text: `${count} word${count === 1 ? "" : "s"} · aim for 30–90` };
}

export function bulletsGuide(bullets: string[]): Guide {
  const count = bullets.filter((b) => b.trim()).length;
  const ok = count >= 2 && count <= 6;
  return { count, ok, text: `${count} bullet${count === 1 ? "" : "s"} · aim for 2–6 per role` };
}

export function skillsGuide(skills: string[]): Guide {
  const count = skills.filter((s) => s.trim()).length;
  const ok = count >= 6 && count <= 15;
  return { count, ok, text: `${count} skill${count === 1 ? "" : "s"} · aim for 6–15` };
}

/* ---------- Page length by market ---------- */

/** Rough years of experience: from the earliest start year to now. */
export function yearsOfExperience(resume: ResumeData, now: Date = new Date()): number {
  const years = resume.experience
    .map((e) => e.startDate?.match(/(\d{4})/)?.[1])
    .filter(Boolean)
    .map(Number);
  return years.length ? Math.max(0, now.getFullYear() - Math.min(...years)) : 0;
}

/**
 * The page length employers in a market expect. USA: 1 page (2 with 10+
 * years). India: 1 page (2 with about 8+ years). UK, Europe, Gulf and no
 * market chosen: up to 2 pages.
 */
export function pageTarget(market: Market | null, resume: ResumeData, now: Date = new Date()): number {
  const years = yearsOfExperience(resume, now);
  if (market === "US") return years >= 10 ? 2 : 1;
  if (market === "IN") return years >= 8 ? 2 : 1;
  return 2;
}
