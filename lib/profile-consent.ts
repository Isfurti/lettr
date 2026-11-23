import { siteUrl } from "./site-url";

/**
 * Version of the "what becomes public" text the owner agreed to before the
 * first share. Bump it when that text changes, so the share dialog asks again.
 * Profiles already shared stay shared: a bump only applies to the next share.
 */
export const PROFILE_CONSENT_VERSION = 1;

/** Youngest age that may publish a profile. */
export const PROFILE_MIN_AGE = 16;

export function profileUrl(slug: string): string {
  return `${siteUrl()}/p/${slug}`;
}

export type ShareFlags = { showCity: boolean; showLinks: boolean; showContact: boolean; showPersonal: boolean };

/**
 * What the share dialog tells the owner, built from the switches as they are now,
 * so the text can never say something is private when it is not. If these lines
 * change in meaning, raise PROFILE_CONSENT_VERSION.
 */
export function consentLines(f: ShareFlags): { shown: string[]; hidden: string[]; never: string } {
  const shown = [
    "Your name, profile picture, headline and summary",
    "Your experience, education, skills, projects, certifications, achievements and languages",
  ];
  const hidden: string[] = [];
  (f.showContact ? shown : hidden).push("Your phone number and email");
  (f.showCity ? shown : hidden).push("Your city and country");
  (f.showLinks ? shown : hidden).push("Your LinkedIn, website and project links");
  (f.showPersonal ? shown : hidden).push("Your work authorization and nationality (if you filled them in)");
  return { shown, hidden, never: "Your date of birth and street address are never shown." };
}
