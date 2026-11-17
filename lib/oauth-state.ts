import { randomBytes, timingSafeEqual } from "node:crypto";

export const DRIVE_STATE_COOKIE = "lettr_drive_state";
export const DRIVE_STATE_MAX_AGE = 600; // seconds: enough to finish Google's consent screen

/** A fresh random value for one connect attempt. It lives in a cookie and in Google's `state`; the two must match on return. */
export function newOAuthState(): string {
  return randomBytes(24).toString("hex");
}

/** Whether the `state` Google sent back is the one this browser started with. */
export function oauthStateMatches(cookieValue: string | undefined | null, state: string | null): boolean {
  if (!cookieValue || !state) return false;
  const a = Buffer.from(cookieValue);
  const b = Buffer.from(state);
  return a.length === b.length && timingSafeEqual(a, b);
}
