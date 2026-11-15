import { createHash } from "node:crypto";

/**
 * One-way hash for single-use links (email verification, password reset).
 * The database stores only the hash, so reading the table does not give
 * anyone a working link. The tokens are 32 random bytes, so a plain SHA-256
 * is enough (no salt or slow hash needed).
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
