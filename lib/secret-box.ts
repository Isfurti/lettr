import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

/**
 * Encrypts secrets (like Google tokens) before they go in the database, so
 * reading the table alone does not reveal them. AES-256-GCM, key from the
 * TOKEN_ENCRYPTION_KEY environment variable (32 random bytes, base64):
 *   openssl rand -base64 32
 *
 * Stored form: "enc:v1:<iv>.<auth tag>.<ciphertext>" (all base64).
 * Values without the "enc:v1:" prefix are older plain-text rows and are
 * returned as they are, so existing connections keep working.
 */
const PREFIX = "enc:v1:";

function getKey(env: Record<string, string | undefined> = process.env): Buffer {
  const raw = env.TOKEN_ENCRYPTION_KEY?.trim();
  if (!raw) throw new Error("TOKEN_ENCRYPTION_KEY is not set (generate one with: openssl rand -base64 32)");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes, base64 encoded");
  return key;
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(PREFIX);
}

export function encryptSecret(plain: string, env?: Record<string, string | undefined>): string {
  const key = getKey(env);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}.${tag.toString("base64")}.${ct.toString("base64")}`;
}

export function decryptSecret(stored: string, env?: Record<string, string | undefined>): string {
  if (!isEncrypted(stored)) return stored; // legacy plain-text value
  const [iv, tag, ct] = stored.slice(PREFIX.length).split(".");
  if (!iv || !tag || !ct) throw new Error("Malformed encrypted value");
  const decipher = createDecipheriv("aes-256-gcm", getKey(env), Buffer.from(iv, "base64"));
  decipher.setAuthTag(Buffer.from(tag, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ct, "base64")), decipher.final()]).toString("utf8");
}
