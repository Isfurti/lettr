import { createHash } from "node:crypto";

/**
 * The same inbox written differently counts as one person:
 * "Priya.Sharma+jobs@gmail.com" and "priyasharma@googlemail.com" match.
 */
export function normaliseEmail(email: string): string {
  const e = email.trim().toLowerCase();
  const at = e.lastIndexOf("@");
  if (at < 1) return e;
  let local = e.slice(0, at);
  let domain = e.slice(at + 1);
  local = local.split("+")[0];
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return `${local}@${domain}`;
}

/** One-way code for an email, so we can spot a repeat without storing the address. */
export function emailHash(email: string | null | undefined): string | null {
  if (!email) return null;
  return createHash("sha256").update(`lettr-free-uses-v1:${normaliseEmail(email)}`).digest("hex");
}
