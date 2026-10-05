import { createHash } from "node:crypto";

/**
 * A stable, anonymous key for rate-limiting visitors who aren't signed in.
 * The IP is hashed (with the app secret as salt) so raw IP addresses are
 * never written to the database.
 */
export function anonymousClientKey(headers: Headers): string {
  const ip =
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const salt = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "lettr";
  return "anon:" + createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
