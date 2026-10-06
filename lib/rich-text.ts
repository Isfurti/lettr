/**
 * Bold, italic and underline inside resume text (summary, bullets, project
 * descriptions, achievements).
 *
 * Stored as plain strings with three simple tags, <b>, <i> and <u>, which the
 * B / I / U buttons insert. They are never put into the page as HTML: they're
 * parsed into segments here and every renderer (preview, PDF, Word) builds
 * its own formatted text from those. Plain-text readers (scores, job match,
 * AI prompts) use stripRich().
 */

export type RichMark = "b" | "i" | "u";
export type RichSegment = { text: string; b: boolean; i: boolean; u: boolean };

const TAG = /<(\/?)(b|i|u)>/gi;

export function hasRich(text: string | null | undefined): boolean {
  if (!text) return false;
  TAG.lastIndex = 0;
  return TAG.test(text);
}

/** Splits text into runs with their formatting. Unclosed tags run to the end; stray closers are ignored. */
export function parseRich(text: string): RichSegment[] {
  const out: RichSegment[] = [];
  const open = { b: 0, i: 0, u: 0 };
  let last = 0;
  const push = (t: string) => {
    if (!t) return;
    const seg = { text: t, b: open.b > 0, i: open.i > 0, u: open.u > 0 };
    const prev = out[out.length - 1];
    if (prev && prev.b === seg.b && prev.i === seg.i && prev.u === seg.u) prev.text += t;
    else out.push(seg);
  };
  TAG.lastIndex = 0;
  for (let m = TAG.exec(text); m; m = TAG.exec(text)) {
    push(text.slice(last, m.index));
    const mark = m[2].toLowerCase() as RichMark;
    if (m[1]) open[mark] = Math.max(0, open[mark] - 1);
    else open[mark]++;
    last = m.index + m[0].length;
  }
  push(text.slice(last));
  return out;
}

export function stripRich(text: string): string {
  return text.replace(TAG, "");
}

/**
 * Applies B / I / U to the selected part of a text field. With a selection
 * already wrapped in that tag it removes the tag instead; with nothing
 * selected it inserts an empty pair and puts the cursor between them.
 * Returns the new value and where the selection should go.
 */
export function toggleMark(
  value: string,
  start: number,
  end: number,
  mark: RichMark
): { value: string; start: number; end: number } {
  const openTag = `<${mark}>`;
  const closeTag = `</${mark}>`;
  const before = value.slice(0, start);
  const selected = value.slice(start, end);
  const after = value.slice(end);

  // Selection sits right inside a pair: <b>|text|</b> → unwrap.
  if (before.toLowerCase().endsWith(openTag) && after.toLowerCase().startsWith(closeTag)) {
    const v = before.slice(0, -openTag.length) + selected + after.slice(closeTag.length);
    return { value: v, start: start - openTag.length, end: end - openTag.length };
  }
  // Selection includes the tags: |<b>text</b>| → unwrap.
  const lower = selected.toLowerCase();
  if (lower.startsWith(openTag) && lower.endsWith(closeTag) && selected.length >= openTag.length + closeTag.length) {
    const inner = selected.slice(openTag.length, selected.length - closeTag.length);
    return { value: before + inner + after, start, end: start + inner.length };
  }
  const v = before + openTag + selected + closeTag + after;
  return { value: v, start: start + openTag.length, end: end + openTag.length };
}

type WithRichFields = {
  summary: string;
  experience: { bullets: string[] }[];
  projects?: { description: string }[];
  achievements?: string[];
};

/** The same resume with B / I / U tags removed, for scoring, job match and AI prompts. */
export function plainResume<T extends WithRichFields>(r: T): T {
  return {
    ...r,
    summary: stripRich(r.summary ?? ""),
    experience: r.experience.map((e) => ({ ...e, bullets: e.bullets.map(stripRich) })),
    projects: r.projects?.map((p) => ({ ...p, description: stripRich(p.description ?? "") })),
    achievements: r.achievements?.map(stripRich),
  };
}
