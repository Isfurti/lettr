import { blankMetric, runResumeChecks, type Finding, type Loc } from "./resume-checks";
import { plainResume, stripRich } from "./rich-text";
import type { ResumeData } from "./types";

/**
 * One-click fixes for the accuracy tips (lib/resume-checks.ts). A fix is a
 * list of exact text edits. Nothing is applied until the person accepts, and
 * an edit is refused if the text has changed since the fix was shown, so a
 * stale card can never overwrite newer work. Undo is the same edits reversed
 * and is refused the same way.
 *
 * shortcut: text with bold/italic marks is skipped (we only edit text that is
 * plain), so a marked-up bullet gets no fix button. Upgrade if that is common.
 */

export type Edit = { loc: Loc; before: string; after: string };

export type Fix = {
  id: string;
  findingId: string;
  title: string;
  /** "rule": plain code. "choice": the person picks one of `choices`. "ai": needs a rewrite option picked first. */
  kind: "rule" | "choice" | "ai";
  edits: Edit[];
  choices?: { label: string; edits: Edit[] }[];
  ai?: { loc: Loc; bullet: string; role: string };
};

// ---------- reading and writing a place ----------

export function readLoc(d: ResumeData, loc: Loc): string | undefined {
  switch (loc.t) {
    case "summary":
      return d.summary;
    case "bullet":
      return d.experience.find((e) => e.id === loc.id)?.bullets[loc.i];
    case "projDesc":
      return d.projects?.find((p) => p.id === loc.id)?.description;
    case "projBullet":
      return d.projects?.find((p) => p.id === loc.id)?.bullets?.[loc.i];
    case "achievement":
      return d.achievements?.[loc.i];
    case "skill":
      return d.skills[loc.i];
    case "groupSkill":
      return d.skillGroups?.find((g) => g.id === loc.id)?.skills[loc.i];
    case "tech":
      return d.projects?.find((p) => p.id === loc.id)?.tech;
    case "contact":
      return d.contact[loc.field];
    case "photo":
      return d.customization?.showPhoto && d.customization.photoDataUrl ? "on" : "off";
  }
}

const setAt = <T,>(list: T[], i: number, v: T) => list.map((x, n) => (n === i ? v : x));

export function writeLoc(d: ResumeData, loc: Loc, v: string): ResumeData {
  switch (loc.t) {
    case "summary":
      return { ...d, summary: v };
    case "bullet":
      return { ...d, experience: d.experience.map((e) => (e.id === loc.id ? { ...e, bullets: setAt(e.bullets, loc.i, v) } : e)) };
    case "projDesc":
      return { ...d, projects: d.projects?.map((p) => (p.id === loc.id ? { ...p, description: v } : p)) };
    case "projBullet":
      return { ...d, projects: d.projects?.map((p) => (p.id === loc.id ? { ...p, bullets: setAt(p.bullets ?? [], loc.i, v) } : p)) };
    case "achievement":
      return { ...d, achievements: setAt(d.achievements ?? [], loc.i, v) };
    case "skill":
      return { ...d, skills: setAt(d.skills, loc.i, v) };
    case "groupSkill":
      return { ...d, skillGroups: d.skillGroups?.map((g) => (g.id === loc.id ? { ...g, skills: setAt(g.skills, loc.i, v) } : g)) };
    case "tech":
      return { ...d, projects: d.projects?.map((p) => (p.id === loc.id ? { ...p, tech: v } : p)) };
    case "contact":
      return { ...d, contact: { ...d.contact, [loc.field]: v } };
    case "photo":
      return { ...d, customization: { ...d.customization, showPhoto: v === "on" } };
  }
}

/** Applies the edits, or returns null if any place no longer holds the text the edit expects. */
export function applyEdits(d: ResumeData, edits: Edit[]): ResumeData | null {
  let out = d;
  for (const e of edits) {
    if (readLoc(out, e.loc) !== e.before) return null;
    out = writeLoc(out, e.loc, e.after);
  }
  return out;
}

/** Reverses applyEdits, refusing if the person has changed any of those places since. */
export function undoEdits(d: ResumeData, edits: Edit[]): ResumeData | null {
  let out = d;
  for (const e of [...edits].reverse()) {
    if (readLoc(out, e.loc) !== e.after) return null;
    out = writeLoc(out, e.loc, e.before);
  }
  return out;
}

// ---------- building edits ----------

/** An edit for `loc` if the text there is plain and `change` actually changes it. */
function editAt(d: ResumeData, loc: Loc, change: (text: string) => string): Edit[] {
  const before = readLoc(d, loc);
  if (before === undefined || stripRich(before) !== before) return [];
  const after = change(before);
  return after === before ? [] : [{ loc, before, after }];
}

/** Where prose lives (the same places the spelling check reads). */
function proseLocs(d: ResumeData): Loc[] {
  return [
    { t: "summary" },
    ...d.experience.flatMap((e) => e.bullets.map((_, i): Loc => ({ t: "bullet", id: e.id, i }))),
    ...(d.projects ?? []).flatMap((p): Loc[] => [{ t: "projDesc", id: p.id }, ...(p.bullets ?? []).map((_, i): Loc => ({ t: "projBullet", id: p.id, i }))]),
    ...(d.achievements ?? []).map((_, i): Loc => ({ t: "achievement", i })),
  ];
}

// British, American. Every word in resume-checks' two lists has its partner here (tested).
const PAIRS: [string, string][] = [
  ["colour", "color"], ["colours", "colors"], ["organise", "organize"], ["organised", "organized"], ["organising", "organizing"],
  ["analyse", "analyze"], ["analysed", "analyzed"], ["analysing", "analyzing"], ["centre", "center"], ["centres", "centers"],
  ["behaviour", "behavior"], ["optimise", "optimize"], ["optimised", "optimized"], ["optimising", "optimizing"],
  ["realise", "realize"], ["realised", "realized"], ["favour", "favor"], ["labour", "labor"], ["defence", "defense"],
  ["prioritise", "prioritize"], ["prioritised", "prioritized"], ["specialise", "specialize"], ["specialised", "specialized"],
  ["utilise", "utilize"], ["utilised", "utilized"], ["recognise", "recognize"], ["recognised", "recognized"],
  ["summarise", "summarize"], ["summarised", "summarized"], ["minimise", "minimize"], ["minimised", "minimized"],
  ["maximise", "maximize"], ["maximised", "maximized"], ["modelling", "modeling"], ["travelling", "traveling"],
  ["cancelled", "canceled"], ["licence", "license"],
];
export const SPELLING_PAIRS = PAIRS;
const TO_US = new Map(PAIRS);
const TO_UK = new Map(PAIRS.map(([uk, us]) => [us, uk] as const));

/** Swaps only the listed lowercase words (a capitalised "Centre" is a name and is left alone). */
export function respell(text: string, market: "US" | "UK"): string {
  const map = market === "US" ? TO_US : TO_UK;
  return text.replace(/\b[a-z]+\b/g, (w) => map.get(w) ?? w);
}

/** Replaces one tool name inside a "React · Firebase" style line, keeping the separators. */
function renamePiece(tech: string, from: string, to: string): string {
  return tech
    .split(/([,·|/•;]+)/)
    .map((part) => (part.trim() === from ? part.replace(from, to) : part))
    .join("");
}

/** Every fix available for the resume right now. Reads plain text only; nothing here changes the resume. */
export function fixesFor(d: ResumeData, findings: Finding[] = runResumeChecks(plainResume(d))): Fix[] {
  const out: Fix[] = [];
  for (const f of findings) {
    const det = f.detail;
    if (!det) continue;
    if (det.kind === "tools") {
      const edits: Edit[] = [];
      for (const { from, to } of det.fixes) {
        d.skills.forEach((s, i) => {
          if (s.trim() === from) edits.push(...editAt(d, { t: "skill", i }, () => to));
        });
        (d.skillGroups ?? []).forEach((g) =>
          g.skills.forEach((s, i) => {
            if (s.trim() === from) edits.push(...editAt(d, { t: "groupSkill", id: g.id, i }, () => to));
          })
        );
        (d.projects ?? []).forEach((p) => edits.push(...editAt(d, { t: "tech", id: p.id }, (t) => renamePiece(t, from, to))));
      }
      if (edits.length) out.push({ id: f.id, findingId: f.id, title: "Fix tool names", kind: "rule", edits });
    } else if (det.kind === "spelling") {
      const edits = proseLocs(d).flatMap((loc) => editAt(d, loc, (t) => respell(t, det.market)));
      if (edits.length) out.push({ id: f.id, findingId: f.id, title: `Switch to ${det.market === "US" ? "American" : "British"} spelling`, kind: "rule", edits });
    } else if (det.kind === "personal") {
      const edits = det.items.flatMap((item): Edit[] =>
        item === "photo" ? editAt(d, { t: "photo" }, () => "off") : editAt(d, { t: "contact", field: item }, () => "")
      );
      if (edits.length) out.push({ id: f.id, findingId: f.id, title: "Remove personal details", kind: "rule", edits });
    } else if (det.kind === "years") {
      const text = d.summary;
      if (det.real >= 2 && stripRich(text) === text && text.slice(det.start, det.end) === String(det.claimed)) {
        const after = text.slice(0, det.start) + det.real + text.slice(det.end);
        out.push({ id: f.id, findingId: f.id, title: `Change ${det.claimed} years to ${det.real}`, kind: "rule", edits: [{ loc: { t: "summary" }, before: text, after }] });
      }
    } else if (det.kind === "repeated") {
      const choices = det.places.map((keep, k) => ({
        label: `Keep it under ${keep.where}`,
        edits: det.places.flatMap((p, n) => (n === k ? [] : p.locs.flatMap((loc) => editAt(d, loc, (t) => blankMetric(t, det.metric))))),
      }));
      if (choices.every((c) => c.edits.length > 0)) out.push({ id: f.id, findingId: f.id, title: `Same figure (${det.metric}) twice`, kind: "choice", edits: [], choices });
    } else if (det.kind === "duty") {
      for (const { id, i } of det.bullets) {
        const loc: Loc = { t: "bullet", id, i };
        const bullet = readLoc(d, loc);
        if (bullet === undefined || stripRich(bullet) !== bullet) continue;
        out.push({
          id: `${f.id}:${id}:${i}`,
          findingId: f.id,
          title: "Rewrite as a result",
          kind: "ai",
          edits: [],
          ai: { loc, bullet, role: d.experience.find((e) => e.id === id)?.role ?? "" },
        });
      }
    }
  }
  return out;
}
