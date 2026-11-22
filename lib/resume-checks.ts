import type { ResumeData } from "./types";
import { toMonthNumber, parseResumeDate, isPresent } from "./resume-dates";
import { marketOf } from "./market";

/**
 * Accuracy checks on a resume: things that are probably mistakes rather than
 * missing content. Pure functions of the resume text, no AI, no network.
 *
 * Every check skips when it cannot be sure (an unreadable date, an unlisted
 * tool name), because a wrong accusation costs more than a missed one.
 * Findings only ever lower the Lettr score, and by at most MAX_PENALTY points.
 */

/** Where a piece of text lives in a resume. Bullets have no ids of their own, so a place is the entry's id plus the position. */
export type Loc =
  | { t: "summary" }
  | { t: "bullet"; id: string; i: number }
  | { t: "projDesc"; id: string }
  | { t: "projBullet"; id: string; i: number }
  | { t: "achievement"; i: number }
  | { t: "skill"; i: number }
  | { t: "groupSkill"; id: string; i: number }
  | { t: "tech"; id: string }
  | { t: "contact"; field: "dateOfBirth" | "nationality" }
  | { t: "photo" };

/** What a check found, in a form the resume fixer (lib/resume-fixes.ts) can act on. The message is unchanged. */
export type FindingDetail =
  | { kind: "years"; claimed: number; real: number; start: number; end: number }
  | { kind: "repeated"; metric: string; places: { where: string; locs: Loc[] }[] }
  | { kind: "tools"; fixes: { from: string; to: string }[] }
  | { kind: "personal"; items: ("photo" | "dateOfBirth" | "nationality")[] }
  | { kind: "spelling"; market: "US" | "UK"; words: string[] }
  | { kind: "duty"; bullets: { id: string; i: number }[] };

export type Finding = {
  id: string;
  severity: "medium" | "low";
  message: string;
  /** Builder section the "fix" button jumps to. */
  section: "summary" | "experience" | "skills" | "contact";
  /** Tips that are advice only and do not lower the score. */
  scored: boolean;
  /** Structured facts about the finding, for the fixer. Not shown to people. */
  detail?: FindingDetail;
};

export const PENALTY_POINTS = { medium: 3, low: 1 } as const;
export const MAX_PENALTY = 10;

/** Points taken off the overall score for a set of findings (never more than MAX_PENALTY). */
export function penaltyFor(findings: Finding[]): number {
  const total = findings.filter((f) => f.scored).reduce((sum, f) => sum + PENALTY_POINTS[f.severity], 0);
  return Math.min(MAX_PENALTY, total);
}

export type CheckOptions = {
  /** Set false when the dates may have been misread by AI (the free checker). */
  verifyDates?: boolean;
  now?: Date;
};

// ---------- 1. Years of experience claimed vs the dates ----------

// The claim must be about total experience: "10 years of experience", "7+ years' professional
// experience". "5 years of React experience" has a skill in between, so it does not match.
const LEAD = "(?:professional|total|combined|industry|work|relevant|hands-on|progressive|proven|extensive)";
const YEARS_BEFORE = new RegExp(String.raw`(?<![\d.])(\d{1,2})\s*\+?\s*(?:years?|yrs?)['\u2019]?\s+(?:of\s+)?(?:${LEAD}\s+)*experience\b`, "i");
const YEARS_AFTER = new RegExp(String.raw`\bexperience\s+(?:of|spanning|over)\s+(?<![\d.])(\d{1,2})\s*\+?\s*(?:years?|yrs?)\b`, "i");
// "a team with 20 years of experience" is about someone else.
const OTHER_SUBJECT = /\b(team|teams|company|firm|agency|organi[sz]ation|our|their|mentors?|clients?|customers?|employers?|partners?|founders?)\b/i;

function claimedYears(summary: string): { years: number; start: number; end: number } | null {
  for (const re of [YEARS_BEFORE, YEARS_AFTER]) {
    const m = re.exec(summary);
    if (!m) continue;
    const before = summary.slice(Math.max(0, m.index - 30), m.index);
    if (OTHER_SUBJECT.test(before)) continue;
    const start = m.index + m[0].indexOf(m[1]);
    return { years: Number(m[1]), start, end: start + m[1].length };
  }
  return null;
}

/** Months worked: the union of every role's date range, so overlapping jobs are not counted twice. Null when any date cannot be read. */
function monthsWorked(resume: ResumeData, now: Date): number | null {
  const ranges: Array<[number, number]> = [];
  const add = (start: string, end: string): boolean => {
    if (!parseResumeDate(start) || !(parseResumeDate(end) || isPresent(end))) return false;
    const s = toMonthNumber(start, "start", now);
    const e = toMonthNumber(end, "end", now);
    if (s === null || e === null) return false;
    if (e < s) return false; // end before start: cannot trust these dates
    ranges.push([s, e]);
    return true;
  };
  for (const exp of resume.experience) {
    if (!add(exp.startDate, exp.endDate)) return null;
    for (const r of exp.earlierRoles ?? []) {
      if (!add(r.startDate, r.endDate)) return null;
    }
  }
  if (ranges.length === 0) return null;
  ranges.sort((a, b) => a[0] - b[0]);
  let total = 0;
  let [curS, curE] = ranges[0];
  for (const [s, e] of ranges.slice(1)) {
    if (s <= curE + 1) curE = Math.max(curE, e);
    else {
      total += curE - curS + 1;
      [curS, curE] = [s, e];
    }
  }
  return total + (curE - curS + 1);
}

function checkYears(resume: ResumeData, opts: CheckOptions): Finding[] {
  if (opts.verifyDates === false) return [];
  const claim = claimedYears(resume.summary ?? "");
  if (claim === null || claim.years < 2) return [];
  const claimed = claim.years;
  const months = monthsWorked(resume, opts.now ?? new Date());
  if (months === null) return [];
  const real = months / 12;
  if (claimed <= real + Math.max(1, real * 0.2)) return [];
  const roundedReal = Math.max(0, Math.round(real));
  return [
    {
      id: "years-vs-dates",
      severity: "medium",
      scored: true,
      section: "summary",
      detail: { kind: "years", claimed, real: roundedReal, start: claim.start, end: claim.end },
      message: `Your summary says ${claimed} years of experience, but the dates in Experience add up to about ${roundedReal}. If the number is right, add the missing roles. Otherwise change it so a recruiter doesn't doubt the rest.`,
    },
  ];
}

// ---------- 2. The same figure in two different jobs or sections ----------

const PERCENT = /\b\d+(?:\.\d+)?\s?%/g;
const CURRENCY = /[$£€₹]\s?\d[\d,]*(?:\.\d+)?\s?(?:k|m|bn|million|billion|crore|cr|lakhs?)?\b/gi;
const SCALED = /\b\d[\d,]*(?:\.\d+)?\s?(?:million|billion|crore|lakhs?)\b/gi;

function metricsIn(text: string): Set<string> {
  const out = new Set<string>();
  for (const re of [PERCENT, CURRENCY, SCALED]) {
    for (const m of text.matchAll(re)) {
      const metric = m[0].toLowerCase().replace(/[\s,]/g, "");
      // Round percentages (10%, 25%, 100%) are common, so seeing one twice proves nothing.
      if (/^\d+%$/.test(metric) && Number(metric.slice(0, -1)) % 5 === 0) continue;
      out.add(metric);
    }
  }
  return out;
}

function checkRepeatedMetric(resume: ResumeData): Finding[] {
  // Places a figure should be told once. The summary is left out: restating
  // your best number in the summary is good practice.
  const places: Array<{ where: string; text: string; parts: Array<{ loc: Loc; text: string }> }> = [];
  const add = (where: string, parts: Array<{ loc: Loc; text: string }>) => places.push({ where, text: parts.map((p) => p.text).join("\n"), parts });
  resume.experience.forEach((e, i) => {
    add(e.company?.trim() ? `your ${e.company.trim()} role` : `role ${i + 1}`, e.bullets.map((text, n) => ({ loc: { t: "bullet", id: e.id, i: n }, text })));
  });
  (resume.projects ?? []).forEach((p) =>
    add("Projects", [{ loc: { t: "projDesc", id: p.id }, text: p.description }, ...(p.bullets ?? []).map((text, n) => ({ loc: { t: "projBullet", id: p.id, i: n } as Loc, text }))])
  );
  add("Achievements", (resume.achievements ?? []).map((text, i) => ({ loc: { t: "achievement", i }, text })));

  const seen = new Map<string, string>();
  for (const place of places) {
    for (const metric of metricsIn(place.text)) {
      const first = seen.get(metric);
      if (first && first !== place.where) {
        return [
          {
            id: "repeated-metric",
            severity: "low",
            scored: true,
            section: "experience",
            detail: {
              kind: "repeated",
              metric,
              places: places
                .filter((p) => metricsIn(p.text).has(metric))
                .map((p) => ({ where: p.where, locs: p.parts.filter((x) => metricsIn(x.text).has(metric)).map((x) => x.loc) })),
            },
            message: `The same figure (${metric}) appears under both ${first} and ${place.where}. If it was copied by mistake, put the real figure under each. If it is true in both places, you can ignore this.`,
          },
        ];
      }
      if (!first) seen.set(metric, place.where);
    }
  }
  return [];
}

// ---------- 3. Tool names ----------

// Whole-entry matches only (a skills list entry, or one piece of a project's
// tech line). A fixed list means ordinary words are never "corrected".
const TOOL_NAMES = [
  "JavaScript", "TypeScript", "PowerPoint", "PostgreSQL", "MySQL", "GitHub", "GitLab", "LinkedIn", "QuickBooks",
  "Salesforce", "WordPress", "Node.js", "Next.js", "React.js", "Vue.js", "MongoDB", "GraphQL", "iOS", "macOS",
  "SharePoint", "HubSpot", "Photoshop", "Illustrator", "InDesign", "Tableau", "Kubernetes", "Docker", "Terraform",
  "Figma", "Jira", "Confluence", "Slack", "Excel", "Microsoft Excel", "Microsoft Word", "Microsoft Office",
  "Google Analytics", "Google Sheets", "Power BI", "SQL Server", "Oracle", "SAP", "AutoCAD", "SolidWorks", "MATLAB",
  "Python", "Java", "Django", "Flask", "FastAPI", "Redis", "Elasticsearch", "Firebase", "Stripe", "Shopify", "Zapier",
  "WhatsApp", "YouTube", "ChatGPT", "OpenAI", "Notion", "Trello", "Asana", "Zoho", "Tally", "TallyPrime", "Canva",
] as const;

const CANONICAL = new Map<string, string>();
for (const name of TOOL_NAMES) CANONICAL.set(name.toLowerCase(), name);

// Common slips that are not just a case difference.
const MISSPELLINGS: Record<string, string> = {
  javascipt: "JavaScript", javascrpit: "JavaScript", javascirpt: "JavaScript", typescirpt: "TypeScript", typscript: "TypeScript",
  phtoshop: "Photoshop", photoshp: "Photoshop", photshop: "Photoshop", ilustrator: "Illustrator", powerpoit: "PowerPoint",
  powerpiont: "PowerPoint", "power point": "PowerPoint", "micorsoft excel": "Microsoft Excel", "microsft excel": "Microsoft Excel",
  "microsoft exel": "Microsoft Excel", exel: "Excel", excell: "Excel", salesfroce: "Salesforce",
  tablaeu: "Tableau", tablau: "Tableau", kubernetis: "Kubernetes", kuberentes: "Kubernetes", kubenetes: "Kubernetes",
  postgress: "PostgreSQL",
  "quick books": "QuickBooks", quickbook: "QuickBooks",
  worpress: "WordPress", wordpres: "WordPress", linkdin: "LinkedIn", linkedln: "LinkedIn", sharepont: "SharePoint",
  hubspott: "HubSpot", whatsap: "WhatsApp", pyhton: "Python", pythn: "Python", docekr: "Docker",
};

function toolPieces(resume: ResumeData): string[] {
  const out: string[] = [];
  for (const s of resume.skills ?? []) out.push(s);
  for (const g of resume.skillGroups ?? []) for (const s of g.skills ?? []) out.push(s);
  for (const p of resume.projects ?? []) {
    for (const piece of (p.tech ?? "").split(/[,·|/•;]+/)) out.push(piece);
  }
  return out.map((s) => s.trim()).filter(Boolean);
}

function checkToolNames(resume: ResumeData): Finding[] {
  const wrong: string[] = [];
  const fixes: { from: string; to: string }[] = [];
  const seen = new Set<string>();
  for (const piece of toolPieces(resume)) {
    const lower = piece.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    // All-lowercase or all-capitals is a style choice, not a mistake: only mixed-case slips ("Javascript") count.
    const styleOnly = piece === piece.toLowerCase() || piece === piece.toUpperCase();
    const right = MISSPELLINGS[lower] ?? (styleOnly ? undefined : CANONICAL.get(lower));
    if (right && right !== piece) {
      wrong.push(`"${piece}" as ${right}`);
      fixes.push({ from: piece, to: right });
    }
  }
  if (wrong.length === 0) return [];
  const shown = wrong.slice(0, 3).join(", ");
  return [
    {
      id: "tool-names",
      severity: "low",
      scored: true,
      section: "skills",
      detail: { kind: "tools", fixes },
      message: `Check how you write tool names: ${shown}${wrong.length > 3 ? ` and ${wrong.length - 3} more` : ""}. Misspelt or oddly written names look careless and can miss keyword matches in hiring software.`,
    },
  ];
}

// ---------- 4. Country format ----------

export const BRITISH = ["colour", "colours", "organise", "organised", "organising", "analyse", "analysed", "analysing", "centre", "centres", "behaviour", "optimise", "optimised", "optimising", "realise", "realised", "favour", "labour", "defence", "prioritise", "prioritised", "specialise", "specialised", "utilise", "utilised", "recognise", "recognised", "summarise", "summarised", "minimise", "minimised", "maximise", "maximised", "modelling", "travelling", "cancelled", "licence"];
export const AMERICAN = ["color", "colors", "analyze", "analyzed", "analyzing", "center", "centers", "behavior", "favor", "labor", "defense", "modeling", "traveling", "canceled"];

function proseOf(resume: ResumeData): string {
  return [
    resume.summary ?? "",
    ...resume.experience.flatMap((e) => e.bullets),
    ...(resume.projects ?? []).flatMap((p) => [p.description, ...(p.bullets ?? [])]),
    ...(resume.achievements ?? []),
  ].join("\n");
}

function wordsFound(text: string, list: string[]): string[] {
  // Lowercase words only: a capitalised "Centre for Policy Studies" is a name.
  const found = new Set<string>();
  for (const w of text.match(/\b[a-z]+\b/g) ?? []) if (list.includes(w)) found.add(w);
  return [...found];
}

function checkCountry(resume: ResumeData): Finding[] {
  const market = marketOf(resume.customization);
  if (market !== "US" && market !== "UK") return [];
  const country = market === "US" ? "US" : "UK";
  const findings: Finding[] = [];

  const c = resume.customization;
  const personal: string[] = [];
  const items: ("photo" | "dateOfBirth" | "nationality")[] = [];
  if (c?.showPhoto && c.photoDataUrl) { personal.push("a photo"); items.push("photo"); }
  if (resume.contact.dateOfBirth?.trim()) { personal.push("a date of birth"); items.push("dateOfBirth"); }
  if (resume.contact.nationality?.trim()) { personal.push("nationality"); items.push("nationality"); }
  if (personal.length > 0) {
    findings.push({
      id: "country-personal",
      severity: "medium",
      scored: false, // advice only: it protects the candidate, so it should not cost them points
      section: "contact",
      detail: { kind: "personal", items },
      message: `${country} employers avoid ${personal.join(", ")} on a resume, because it keeps hiring fair, and some will set aside resumes that include it. You can remove ${personal.length === 1 ? "it" : "them"} unless you have a reason to keep ${personal.length === 1 ? "it" : "them"}.`,
    });
  }

  const prose = proseOf(resume);
  const otherSpelling = wordsFound(prose, market === "US" ? BRITISH : AMERICAN);
  if (otherSpelling.length >= 2) {
    findings.push({
      id: "country-spelling",
      severity: "low",
      scored: true,
      section: "summary",
      detail: { kind: "spelling", market, words: otherSpelling },
      message: `You chose to apply in the ${country}, but the text uses ${market === "US" ? "British" : "American"} spelling (${otherSpelling.slice(0, 3).join(", ")}). Switch to ${market === "US" ? "American" : "British"} spelling so it reads as local.`,
    });
  }
  return findings;
}

// ---------- 5. Bullets that describe duties, not results ----------

const DUTY_START = /^\s*(?:responsible for|responsibilities (?:include|included)|duties (?:include|included)|worked on|helped(?: with| to)?|assisted with|tasked with|in charge of|involved in)\b/i;

function checkDutyBullets(resume: ResumeData): Finding[] {
  const dutyAt = resume.experience.flatMap((e) =>
    e.bullets.map((b, i) => ({ id: e.id, i, b })).filter((x) => DUTY_START.test(x.b) && !/\d/.test(x.b))
  );
  const duty = dutyAt.map((x) => x.b);
  if (duty.length < 2) return [];
  const sample = duty[0].trim().replace(/\s+/g, " ");
  return [
    {
      id: "duty-bullets",
      severity: "medium",
      scored: true,
      section: "experience",
      detail: { kind: "duty", bullets: dutyAt.map(({ id, i }) => ({ id, i })) },
      message: `${duty.length} bullets describe duties instead of results (for example "${sample.length > 60 ? sample.slice(0, 57) + "..." : sample}"). Say what changed because of your work: what you improved, built or won.`,
    },
  ];
}

/** `text` with every occurrence of the figure `metric` (as found by the repeated-figure check) turned into a [X] blank: "34%" becomes "[X]%". */
export function blankMetric(text: string, metric: string): string {
  let out = text;
  for (const re of [PERCENT, CURRENCY, SCALED]) {
    out = out.replace(re, (m) => (m.toLowerCase().replace(/[\s,]/g, "") === metric ? m.replace(/\d[\d,]*(?:\.\d+)?/, "[X]") : m));
  }
  return out;
}

/** Every finding for a resume, in a fixed order. Expects text with formatting marks already removed. */
export function runResumeChecks(resume: ResumeData, opts: CheckOptions = {}): Finding[] {
  return [
    ...checkYears(resume, opts),
    ...checkDutyBullets(resume),
    ...checkCountry(resume),
    ...checkToolNames(resume),
    ...checkRepeatedMetric(resume),
  ];
}
