import type { ResumeData } from "./types";

/**
 * Saved resumes are JSON in the `resumes.data` column, and the shape changes
 * over time. Every saved resume carries a `version` so old rows can be
 * brought up to date when they are read or saved, without a risky bulk rewrite.
 *
 * To change the shape in a way old rows don't fit:
 *   1. Bump CURRENT_RESUME_VERSION.
 *   2. Add a step to STEPS that turns version N-1 into N.
 *   3. Add a test with a saved example of the old shape.
 * Changes that only ADD an optional field don't need a version bump.
 *
 * Rows saved before versions existed have no `version`; they are treated as 0.
 *
 * Rollbacks and previews: code that is older than a row's version must not
 * edit it. The PUT route answers 409 in that case (see isNewerThanSupported).
 * Builds from before this file existed have no such guard, so previews of
 * old branches on the shared production database are unsafe after a bump.
 */
export const CURRENT_RESUME_VERSION = 1;

type Raw = Record<string, unknown>;
type Step = (data: Raw) => Raw;

/** STEPS[n] upgrades a resume from version n to n + 1. Steps must not change their input (it is a copy anyway). */
const STEPS: Step[] = [
  // 0 -> 1: nothing changes in the data; this only starts recording the version.
  (data) => data,
];

function isPlainObject(v: unknown): v is Raw {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** The version a piece of data says it has: whole number, at least 0; anything else counts as 0. */
export function versionOf(raw: unknown): number {
  const v = isPlainObject(raw) ? raw.version : undefined;
  return typeof v === "number" && Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0;
}

/** True when the data was saved by a newer version of the code than this one understands. */
export function isNewerThanSupported(raw: unknown, current = CURRENT_RESUME_VERSION): boolean {
  return versionOf(raw) > current;
}

/**
 * Brings a saved resume up to the current shape, step by step from the
 * version it claims. Data from a NEWER version is returned untouched.
 * Throws if it isn't a JSON object. Works on a deep copy.
 * `steps` and `current` exist so tests can try a future version.
 */
export function upgradeResumeData(raw: unknown, steps: Step[] = STEPS, current = CURRENT_RESUME_VERSION): ResumeData {
  if (!isPlainObject(raw)) throw new TypeError("Saved resume data is not an object");
  let data = structuredClone(raw);
  let version = versionOf(data);
  if (version > current) return data as unknown as ResumeData;
  while (version < current) {
    data = steps[version](data);
    version++;
  }
  data.version = current;
  return data as unknown as ResumeData;
}

/** Reads the JSON stored in `resumes.data` and upgrades it. */
export function parseStoredResume(json: string): ResumeData {
  return upgradeResumeData(JSON.parse(json));
}

/**
 * Prepares resume JSON for saving: upgraded from the version it claims, so
 * data from a stale browser tab, a guest draft or a cached import is not
 * labelled current without being upgraded. Anything that isn't a JSON object,
 * and data from a newer version, is left alone (the routes reject those).
 */
export function prepareResumeJsonForSave(json: string): string {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return json;
  }
  if (!isPlainObject(parsed) || isNewerThanSupported(parsed)) return json;
  return JSON.stringify(upgradeResumeData(parsed));
}
