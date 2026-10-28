/**
 * Resume dates are stored as plain text ("Jan 2024", "2019", "Present") so
 * every template, PDF and Word export keeps working. These helpers read them
 * as points on the calendar, so the builder and the ATS score can tell when
 * an end date comes before its start, or a date hasn't happened yet.
 */

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** How far ahead an expected graduation date may go. */
export const EXPECTED_YEARS_AHEAD = 6;

type YearMonth = { year: number; month: number | null };

/** "Jan 2024", "January 2024", "01/2024", "2024-01" or "2024". Null for anything else, including "Present". */
export function parseResumeDate(value: string | null | undefined): YearMonth | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  let m = v.match(/^([A-Za-z]{3,9})\.?,?\s+(\d{4})$/);
  if (m) {
    const idx = MONTHS.findIndex((mo) => mo.toLowerCase() === m![1].slice(0, 3).toLowerCase());
    return idx >= 0 ? { year: +m[2], month: idx } : null;
  }
  m = v.match(/^(\d{1,2})[/-](\d{4})$/);
  if (m && +m[1] >= 1 && +m[1] <= 12) return { year: +m[2], month: +m[1] - 1 };
  m = v.match(/^(\d{4})-(\d{1,2})$/);
  if (m && +m[2] >= 1 && +m[2] <= 12) return { year: +m[1], month: +m[2] - 1 };
  m = v.match(/^(\d{4})$/);
  if (m) return { year: +m[1], month: null };
  return null;
}

export function isPresent(value: string | null | undefined): boolean {
  return /^(present|current|now|ongoing|till date|to date)$/i.test((value ?? "").trim());
}

/** Months since year 0, so dates compare as numbers. */
export function monthNumber(year: number, month: number): number {
  return year * 12 + month;
}

/** This month, as a month number. */
export function currentMonthNumber(now: Date = new Date()): number {
  return monthNumber(now.getFullYear(), now.getMonth());
}

/**
 * The month a date stands for. A year on its own counts as January when it
 * starts something and December when it ends something, so "2022 to 2022"
 * is fine. "Present" is this month.
 */
export function toMonthNumber(value: string | null | undefined, edge: "start" | "end", now: Date = new Date()): number | null {
  if (isPresent(value)) return currentMonthNumber(now);
  const d = parseResumeDate(value);
  if (!d) return null;
  return monthNumber(d.year, d.month ?? (edge === "start" ? 0 : 11));
}

/** True when both dates are filled in and the end comes before the start. */
export function endsBeforeStart(start: string | null | undefined, end: string | null | undefined, now: Date = new Date()): boolean {
  const s = toMonthNumber(start, "start", now);
  const e = toMonthNumber(end, "end", now);
  return s !== null && e !== null && e < s;
}

/** True when the date is after this month (a job or course that hasn't started yet). */
export function isInFuture(value: string | null | undefined, now: Date = new Date()): boolean {
  if (isPresent(value)) return false;
  const n = toMonthNumber(value, "start", now);
  return n !== null && n > currentMonthNumber(now);
}

/** What's wrong with a start/end pair, in words, or null when it's fine. */
export function datePairProblem(
  start: string | null | undefined,
  end: string | null | undefined,
  opts: { endMayBeFuture?: boolean } = {},
  now: Date = new Date()
): string | null {
  if (endsBeforeStart(start, end, now)) return "The end date is before the start date.";
  if (isInFuture(start, now)) return "The start date hasn't happened yet.";
  if (!opts.endMayBeFuture && isInFuture(end, now)) return "The end date hasn't happened yet. Tick \"I currently work here\" if you still do.";
  return null;
}
