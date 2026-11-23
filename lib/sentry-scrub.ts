/**
 * A shared profile's address is a private link: whoever holds it can see the
 * page. Error and performance reports must not keep it, so every URL that
 * reaches Sentry has the link part replaced before it is sent.
 */
const PROFILE_PATH = /\/p\/[^/?#\s"']+/g;

export function scrubProfileUrls(value: string): string {
  return value.replace(PROFILE_PATH, "/p/[link]");
}

/** Walks any Sentry event/breadcrumb and scrubs every string in it. Returns a copy; never throws. */
export function scrubDeep<T>(input: T, depth = 0): T {
  try {
    if (typeof input === "string") return scrubProfileUrls(input) as T;
    if (depth > 8 || input === null || typeof input !== "object") return input;
    if (Array.isArray(input)) return input.map((v) => scrubDeep(v, depth + 1)) as T;
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(input as Record<string, unknown>)) out[k] = scrubDeep(v, depth + 1);
    return out as T;
  } catch {
    return input;
  }
}
