/**
 * Keeps AI rewrites honest. Lettr promises that the AI rephrases what the
 * person told it and never makes things up: where a number would help but
 * wasn't given, it leaves a blank like [X]% for them to fill in.
 *
 * HONESTY_RULES goes into every writing prompt and does most of the work.
 * guardRewrites() is the backstop: plain code, no AI, run on every option
 * before anyone sees it.
 * - A number the person never gave becomes a blank: "by 30%" → "by [X]%",
 *   "₹2 Cr" → "₹[X] Cr". Numbers they gave, and blanks, are left alone.
 * - An option that claims something they never said (beat targets, market
 *   share, awards, promotions, enterprise accounts, crores...) is dropped.
 * - "Grew", "increased", "cut" and other results need a blank or a real
 *   number, so "Drove revenue growth" alone is dropped but
 *   "Grew sales by [X]%" is fine: the person fills in the real figure.
 *
 * Pure functions only, so it's all unit tested (tests/ai-honesty.test.ts).
 */

export const HONESTY_RULES = `Honesty rules (these matter more than anything else):
- Use only the facts given. Rephrase them, but never add results, numbers, targets, rankings, awards, promotions, team sizes, budgets, clients, accounts, tools, industries or scope that aren't stated.
- Where a number or result would make it stronger but isn't given, leave a blank in square brackets for the person to fill in, like [X]%, ₹[X], [number] or [result]. Never guess a figure.
- Use plain, specific verbs (Led, Built, Sold, Cut, Grew, Handled). Avoid buzzwords such as "spearheaded", "leveraged", "synergy", "dynamic", "results-driven" and "cultivated".`;

/**
 * A number on its own, not part of a word like B2B, Q2 or EC2. A trailing
 * x / k / m / b / l counts as a unit ("3x", "10K", "2M"). Square-bracket
 * blanks are matched first so the numbers inside them are never touched.
 */
const BLANK_OR_NUMBER = /\[[^\]]*\]|(?<![A-Za-z0-9])\d(?:[\d,]*\d)?(?:\.\d+)?(?=[xXkKmMbBlL]\b|[^A-Za-z0-9]|$)/g;

function normaliseNumber(n: string): string {
  return n.replace(/,/g, "");
}

/** Every number written in a piece of text, normalised ("1,200" → "1200"). */
export function numbersIn(text: string): Set<string> {
  const found = new Set<string>();
  for (const m of text.matchAll(BLANK_OR_NUMBER)) {
    if (!m[0].startsWith("[")) found.add(normaliseNumber(m[0]));
  }
  return found;
}

/** Swaps any number the person didn't give for a [X] blank. */
export function blankInventedNumbers(option: string, allowed: Set<string>): string {
  return option.replace(BLANK_OR_NUMBER, (m) => {
    if (m.startsWith("[")) return m;
    return allowed.has(normaliseNumber(m)) ? m : "[X]";
  });
}

/**
 * Claims that need the person to have said them. Each one is supported only
 * when the source text matches the same pattern.
 */
const HARD_CLAIMS: { id: string; re: RegExp }[] = [
  { id: "beat-targets", re: /\b(exceed(s|ed|ing)?|surpass(es|ed|ing)?|outperform(s|ed|ing)?|beat|beating|overachiev\w*)\b/i },
  { id: "targets", re: /\b(targets?|quotas?)\b/i },
  { id: "market-share", re: /\bmarket share\b/i },
  {
    id: "recognition",
    re: /\b(awards?|awarded|recogni[sz]ed|recognition|record[- ]breaking|top[- ]performer|top[- ]performing|ranked|number one|best[- ]in[- ]class)\b|#\s?1\b/i,
  },
  { id: "promotion", re: /\b(promoted|promotion)\b/i },
  { id: "scale", re: /\b(enterprise|fortune \d+|multi[- ]million|millions?|billions?|crores?|cr|lakhs?|lacs?)\b/i },
];

/** Results ("grew", "cut", "saved"...). Allowed with a blank or a number the person gave. */
const RESULT_WORDS =
  /\b(gr[eo]w|grows|growing|grown|growth|increas\w*|boost\w*|improv\w*|rais(e|ed|es|ing)|lift(s|ed|ing)?|expand\w*|doubl\w*|tripl\w*|reduc\w*|cut|cuts|cutting|sav(e|ed|es|ing)|accelerat\w*)\b/i;

const HAS_BLANK = /\[[^\]]+\]/;

/** Why an option makes a claim the source doesn't support, or null if it doesn't. */
export function unsupportedClaim(option: string, source: string): string | null {
  for (const claim of HARD_CLAIMS) {
    if (claim.re.test(option) && !claim.re.test(source)) return claim.id;
  }
  if (RESULT_WORDS.test(option) && !RESULT_WORDS.test(source) && !HAS_BLANK.test(option) && !/\d/.test(source)) {
    return "result-without-blank";
  }
  return null;
}

export type GuardResult = { kept: string[]; dropped: string[] };

/**
 * Cleans AI rewrite options against what the person actually wrote.
 * `source` is everything they gave (their bullet, role, experience, skills);
 * `extraNumbers` are figures worked out from it, like years of experience.
 */
export function guardRewrites(source: string, options: string[], extraNumbers: (string | number)[] = []): GuardResult {
  const allowed = numbersIn(source);
  for (const n of extraNumbers) allowed.add(normaliseNumber(String(n)));
  const kept: string[] = [];
  const dropped: string[] = [];
  const seen = new Set<string>();
  for (const raw of options) {
    const option = raw.trim();
    if (!option) continue;
    if (unsupportedClaim(option, source)) {
      dropped.push(option);
      continue;
    }
    const clean = blankInventedNumbers(option, allowed);
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(clean);
  }
  return { kept, dropped };
}

/** The extra instruction for the one retry when too many options were dropped. */
export function retryReminder(dropped: string[]): string {
  const example = dropped[0] ? ` For example, this one added things that weren't given: "${dropped[0].slice(0, 200)}".` : "";
  return `\n\nImportant: your last options were rejected because they added facts the person never gave.${example} Write 3 new options that only rephrase the facts above, with [X]-style blanks for any result or number.`;
}

/** Roughly how many years someone has worked, from their role dates ("Jun 2021" to "Present"). Null if it can't be told. */
export function yearsOfExperience(
  roles: { startDate: string; endDate: string }[],
  now: Date = new Date()
): number | null {
  const thisYear = now.getFullYear();
  const yearOf = (d: string) => {
    if (/present|current|now/i.test(d)) return thisYear;
    const m = d.match(/(19|20)\d{2}/);
    return m ? Number(m[0]) : null;
  };
  const starts = roles.map((r) => yearOf(r.startDate)).filter((y): y is number => y !== null);
  const ends = roles.map((r) => yearOf(r.endDate) ?? yearOf(r.startDate)).filter((y): y is number => y !== null);
  if (!starts.length || !ends.length) return null;
  const years = Math.max(...ends) - Math.min(...starts);
  return years >= 1 ? years : null;
}
