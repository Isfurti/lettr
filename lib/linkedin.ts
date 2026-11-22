import { extractKeywords, keywordInText } from "./ats-score";
import { stripRich } from "./rich-text";
import type { ResumeData } from "./types";

/**
 * LinkedIn profile optimiser: the plain-code parts (no AI). Lettr cannot read
 * or change a LinkedIn page, so the person pastes text, uploads the PDF that
 * LinkedIn exports, or starts from a Lettr resume. Nothing here is stored.
 */

export const HEADLINE_MAX = 220; // LinkedIn's headline limit
export const ABOUT_MAX = 2600; // LinkedIn's About limit
export const INPUT_CAPS = { headline: 400, about: 5000, experience: 12000, skills: 2000, targetRole: 120 } as const;
export const MAX_EXPERIENCE_LINES = 6;

export type LinkedInSections = { headline: string; about: string; experience: string; skills: string };
export const EMPTY_SECTIONS: LinkedInSections = { headline: "", about: "", experience: "", skills: "" };

/** Cuts text to a limit at a word boundary. */
export function clampText(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const at = cut.lastIndexOf(" ");
  return (at > max * 0.6 ? cut.slice(0, at) : cut).replace(/[\s,;:-]+$/, "");
}
export const clampHeadline = (s: string) => clampText(s.replace(/\s+/g, " "), HEADLINE_MAX);
export const clampAbout = (s: string) => clampText(s, ABOUT_MAX);

export function capSections(s: Partial<LinkedInSections>): LinkedInSections {
  const c = (v: unknown, n: number) => (typeof v === "string" ? v.slice(0, n) : "");
  return {
    headline: c(s.headline, INPUT_CAPS.headline),
    about: c(s.about, INPUT_CAPS.about),
    experience: c(s.experience, INPUT_CAPS.experience),
    skills: c(s.skills, INPUT_CAPS.skills),
  };
}

/** Everything the person gave, as one block of facts for the honesty and grounding checks. */
export function sourceFacts(s: LinkedInSections, targetRole: string): string {
  return [s.headline, s.about, s.experience, s.skills, targetRole].join("\n");
}

/** The longest experience lines, which are the ones worth rewriting. */
export function experienceLines(experience: string): string[] {
  return experience
    .split(/\n+/)
    .map((l) => l.replace(/^[\s•\-–*·▪]+/, "").trim())
    .filter((l) => l.length >= 25)
    .sort((a, b) => b.length - a.length)
    .slice(0, MAX_EXPERIENCE_LINES);
}

// ---------- the score ----------

export type Reason = { ok: boolean; text: string; points: number; max: number };
export type ProfileScore = { score: number; reasons: Reason[] };

/** A 0 to 100 score with reasons, in code. Same idea as the ATS report: a guide, not a promise. */
export function scoreProfile(s: LinkedInSections, targetRole: string): ProfileScore {
  const reasons: Reason[] = [];
  const add = (ok: boolean, max: number, good: string, bad: string, partial = 0) => {
    const points = ok ? max : Math.min(partial, max);
    reasons.push({ ok, text: ok ? good : bad, points, max });
  };

  const h = s.headline.trim();
  add(h.length >= 40 && h.length <= HEADLINE_MAX, 20, "Your headline is a good length.", h ? (h.length > HEADLINE_MAX ? `Your headline is over LinkedIn's ${HEADLINE_MAX}-character limit.` : "Your headline is short. Add your role, your strongest skills and who you help.") : "Add a headline. It is the first thing people read.", h ? 8 : 0);

  const roleWords = extractKeywords(targetRole, 5);
  const roleInHeadline = roleWords.length > 0 && roleWords.some((k) => keywordInText(k, h));
  add(roleInHeadline || !targetRole.trim(), 15, targetRole.trim() ? "Your headline names your target role." : "Add a target role to check your keywords.", `Your headline does not mention "${targetRole.trim()}". Recruiters search by role.`);

  const a = s.about.trim();
  const aboutOk = a.length >= 300 && a.length <= ABOUT_MAX;
  add(aboutOk, 20, "Your About section has a good length.", a ? (a.length > ABOUT_MAX ? `Your About is over LinkedIn's ${ABOUT_MAX}-character limit.` : "Your About is short. Aim for two or three short paragraphs.") : "Add an About section: who you are, what you do well, what you want next.", a ? 8 : 0);

  const lines = experienceLines(s.experience).length;
  add(lines >= 3, 20, "Your experience has clear points.", "Your experience needs more detail. Add short points about what you did and what changed.", lines >= 1 ? 8 : 0);

  const skills = s.skills.split(/[,\n;•]+/).map((x) => x.trim()).filter(Boolean);
  add(skills.length >= 8, 15, "You list enough skills.", `You list ${skills.length} skill${skills.length === 1 ? "" : "s"}. Aim for 8 or more that you can back up.`, Math.min(skills.length, 7));

  const blob = [h, a, s.experience, s.skills].join("\n");
  const kws = extractKeywords(targetRole, 8);
  const covered = kws.filter((k) => keywordInText(k, blob)).length;
  add(kws.length === 0 || covered / kws.length >= 0.6, 10, "Your profile uses the words for your target role.", "Your profile uses few of the words for your target role. Add the ones that are true for you.", kws.length ? Math.round((covered / kws.length) * 10) : 0);

  const score = Math.min(100, reasons.reduce((n, r) => n + r.points, 0));
  return { score, reasons };
}

// ---------- input helpers ----------

/** A starting point from a Lettr resume, so nothing is typed twice. */
export function linkedinFromResume(r: ResumeData): LinkedInSections {
  const exp = r.experience
    .map((e) => [`${stripRich(e.role)}${e.company ? `, ${stripRich(e.company)}` : ""}`, ...e.bullets.map((b) => `• ${stripRich(b)}`)].join("\n"))
    .join("\n\n");
  return {
    headline: "",
    about: stripRich(r.summary),
    experience: exp,
    skills: r.skills.map(stripRich).join(", "),
  };
}

/** Splits the text of a LinkedIn "Save to PDF" export into the four sections. Best effort. */
export function splitLinkedInPdf(text: string): LinkedInSections {
  const lines = text.replace(/\r/g, "").split("\n").map((l) => l.trim());
  const heading = (l: string) => {
    const x = l.toLowerCase();
    if (x === "summary" || x === "about") return "about";
    if (x === "experience") return "experience";
    if (x === "top skills" || x === "skills") return "skills";
    if (["education", "certifications", "languages", "contact", "honors-awards", "publications", "projects", "volunteer experience", "licenses & certifications"].includes(x)) return "other";
    return null;
  };
  const out: LinkedInSections = { ...EMPTY_SECTIONS };
  let cur: keyof LinkedInSections | "other" | null = null;
  const body: string[] = [];
  for (const l of lines) {
    if (/^page \d+ of \d+$/i.test(l)) continue;
    const h = heading(l);
    if (h) {
      cur = h;
      continue;
    }
    if (cur && cur !== "other" && l) out[cur] += (out[cur] ? "\n" : "") + l;
    if (!cur && l) body.push(l);
  }
  // The headline sits under the name near the top, before any heading.
  out.headline = body.slice(1, 3).join(" ").slice(0, INPUT_CAPS.headline);
  return capSections(out);
}

/** Plain advice that needs no AI. Nothing here is automated: the person does these on LinkedIn. */
export const LINKEDIN_TIPS = [
  "Use a clear, well-lit photo of just you. Profiles with a photo are easier to trust.",
  "Add a banner that says what you do, or leave the default.",
  "Make your profile link short and clean: linkedin.com/in/your-name (Edit public profile and URL).",
  "Turn on Open to Work only if you want recruiters to see it, and pick the roles you want.",
  "Put the most important words for your target role in your headline and in your first two lines of About, because that is what shows before 'see more'.",
  "Ask two or three people you worked with for a recommendation.",
];
