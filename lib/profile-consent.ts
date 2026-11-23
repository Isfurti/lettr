import { siteUrl } from "./site-url";

/**
 * Version of the "what becomes public" text the owner agreed to before the
 * first share. Bump it when that text changes, so the share dialog asks again.
 */
export const PROFILE_CONSENT_VERSION = 1;

/** Youngest age that may publish a profile. */
export const PROFILE_MIN_AGE = 16;

export function profileUrl(slug: string): string {
  return `${siteUrl()}/p/${slug}`;
}
