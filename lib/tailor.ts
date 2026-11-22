import { extractKeywords, keywordInText, scoreResumeAgainstJob } from "./ats-score";
import { readLoc, writeLoc } from "./resume-fixes";
import { ungroundedTerms } from "./ai-grounding";
import { stripRich } from "./rich-text";
import type { ResumeData } from "./types";

/**
 * Tailor to a job post. Everything here is plain code, no AI, and none of it
 * can add a fact the resume does not already hold:
 *  - skills are only re-ordered (the same skills, matching ones first);
 *  - job keywords the resume lacks are listed as gaps, never added;
 *  - bullets are picked for rewording only if they already say something the
 *    job asks for.
 * The rewording itself is done by lib/ai.ts tailorResume, which is guarded by
 * the same honesty and grounding checks as every other AI feature.
 */

export const MAX_TAILOR_BULLETS = 8;
export const MIN_JOB_POST_CHARS = 60;

export type BulletTarget = { id: string; i: number; bullet: string; role: string; hits: string[] };

export type TailorPlan = {
  /** Job keywords the resume does not show. Shown as "add only if true". */
  gaps: string[];
  /** Job keywords the resume already shows. */
  matched: string[];
  /** The same skills, matching ones first; null if nothing would move. */
  skillOrder: string[] | null;
  /** Why skills were left alone, if they were (grouped skills). */
  skillNote?: string;
  targets: BulletTarget[];
};

/** The same skills with the ones the job post asks for first. Never adds or drops one. */
export function reorderSkills(skills: string[], jobPost: string): string[] | null {
  const keywords = extractKeywords(jobPost);
  const score = (s: string) => keywords.filter((k) => keywordInText(k, s)).length;
  const ranked = skills.map((s, n) => ({ s, n, sc: score(s) }));
  ranked.sort((a, b) => b.sc - a.sc || a.n - b.n);
  const out = ranked.map((r) => r.s);
  return out.every((s, n) => s === skills[n]) ? null : out;
}

export function planTailor(resume: ResumeData, jobPost: string): TailorPlan {
  const ats = scoreResumeAgainstJob(resume, jobPost);
  const keywords = extractKeywords(jobPost);

  const candidates: BulletTarget[] = [];
  for (const exp of resume.experience) {
    exp.bullets.forEach((bullet, i) => {
      if (!bullet.trim() || stripRich(bullet) !== bullet) return; // marked-up text is left alone
      const hits = keywords.filter((k) => keywordInText(k, bullet));
      if (hits.length) candidates.push({ id: exp.id, i, bullet, role: exp.role, hits });
    });
  }
  candidates.sort((a, b) => b.hits.length - a.hits.length);

  const grouped = (resume.skillGroups?.length ?? 0) > 0;
  return {
    gaps: ats.missingKeywords,
    matched: ats.matchedKeywords,
    skillOrder: grouped ? null : reorderSkills(resume.skills, jobPost),
    skillNote: grouped ? "Your skills are in groups, so their order was left as it is." : undefined,
    targets: candidates.slice(0, MAX_TAILOR_BULLETS),
  };
}

export type TailorChange =
  | { kind: "summary"; before: string; after: string }
  | { kind: "bullet"; id: string; i: number; before: string; after: string }
  | { kind: "skills"; before: string[]; after: string[] };

/**
 * Applies the changes the person accepted to a copy of the resume. Returns
 * null if anything no longer matches what the change expects (the resume was
 * edited meanwhile) or if a skills change would add or drop a skill, so a
 * stale or tampered request can never write something unexpected.
 */
export function applyTailorChanges(resume: ResumeData, changes: TailorChange[]): ResumeData | null {
  let out = resume;
  for (const c of changes) {
    if (c.kind === "summary") {
      if (out.summary !== c.before) return null;
      out = { ...out, summary: c.after };
    } else if (c.kind === "bullet") {
      const loc = { t: "bullet", id: c.id, i: c.i } as const;
      if (readLoc(out, loc) !== c.before) return null;
      out = writeLoc(out, loc, c.after);
    } else {
      const same = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join("\n") === [...b].sort().join("\n");
      if (out.skills.join("\n") !== c.before.join("\n") || !same(c.before, c.after)) return null;
      out = { ...out, skills: c.after };
    }
  }
  return out;
}

/** A free name for a version: "Legal assistant", then "Legal assistant (2)"... */
export function uniqueVersionName(wanted: string, existing: string[]): string {
  const base = wanted.trim().replace(/\s+/g, " ").slice(0, 60) || "Tailored";
  const taken = new Set(existing.map((n) => n.toLowerCase()));
  if (!taken.has(base.toLowerCase())) return base;
  for (let n = 2; n < 100; n++) {
    const name = `${base} (${n})`;
    if (!taken.has(name.toLowerCase())) return name;
  }
  return `${base} (${Date.now() % 1000})`;
}

/** True when `x` has the basic shape of a saved resume (so it is safe to read). */
export function looksLikeResume(x: unknown): x is ResumeData {
  if (typeof x !== "object" || x === null) return false;
  const r = x as Record<string, unknown>;
  return (
    typeof r.summary === "string" &&
    Array.isArray(r.skills) && r.skills.every((s) => typeof s === "string") &&
    Array.isArray(r.experience) &&
    r.experience.every((e) => typeof e === "object" && e !== null && typeof (e as { id?: unknown }).id === "string" && Array.isArray((e as { bullets?: unknown }).bullets)) &&
    Array.isArray(r.education) &&
    typeof r.contact === "object" && r.contact !== null
  );
}

/**
 * Server-side guard for saving a version. The proposed resume may differ from
 * its original only in the skills order, the summary and the text of
 * experience bullets, and every reworded piece may use only names that were
 * already in the person's own text. Returns a reason when it does not hold.
 */
export function checkTailoredVersion(parent: ResumeData, proposed: ResumeData): string | null {
  if (parent.skills.length !== proposed.skills.length || [...parent.skills].sort().join("\n") !== [...proposed.skills].sort().join("\n")) {
    return "A tailored version can only reorder skills, not add or remove them.";
  }
  if (parent.experience.length !== proposed.experience.length) return "Experience entries cannot be added or removed in a tailored version.";
  const roles = new Map(parent.experience.map((e) => [e.id, e]));
  for (const e of proposed.experience) {
    const orig = roles.get(e.id);
    if (!orig || orig.bullets.length !== e.bullets.length) return "Experience entries cannot be added or removed in a tailored version.";
    for (let i = 0; i < e.bullets.length; i++) {
      if (e.bullets[i] !== orig.bullets[i] && ungroundedTerms(e.bullets[i], `${orig.bullets[i]}\n${orig.role}`).length) {
        return "A reworded bullet mentions something that is not in your original. Use a different option.";
      }
    }
  }
  if (proposed.summary !== parent.summary && ungroundedTerms(proposed.summary, `${parent.summary}\n${parent.skills.join(", ")}`).length) {
    return "The new summary mentions something that is not in your original. Use a different option.";
  }
  const frame = (r: ResumeData) =>
    JSON.stringify({ ...r, summary: "", skills: [], experience: r.experience.map((e) => ({ ...e, bullets: [] })) });
  if (frame(parent) !== frame(proposed)) return "A tailored version can only change the summary, the skills order and experience bullets.";
  return null;
}
