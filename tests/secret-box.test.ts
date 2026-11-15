import { describe, expect, it } from "vitest";
import { randomBytes } from "node:crypto";
import { decryptSecret, encryptSecret, isEncrypted } from "@/lib/secret-box";

const env = { TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64") };

describe("secret box", () => {
  it("round-trips and does not store the plain text", () => {
    const stored = encryptSecret("ya29.access-token", env);
    expect(stored).not.toContain("ya29");
    expect(isEncrypted(stored)).toBe(true);
    expect(decryptSecret(stored, env)).toBe("ya29.access-token");
  });

  it("uses a fresh random value each time", () => {
    expect(encryptSecret("same", env)).not.toBe(encryptSecret("same", env));
  });

  it("returns older plain-text values unchanged", () => {
    expect(isEncrypted("1//plain-refresh")).toBe(false);
    expect(decryptSecret("1//plain-refresh", {})).toBe("1//plain-refresh");
  });

  it("refuses a wrong key or tampered value", () => {
    const stored = encryptSecret("secret", env);
    expect(() => decryptSecret(stored, { TOKEN_ENCRYPTION_KEY: randomBytes(32).toString("base64") })).toThrow();
    expect(() => decryptSecret(stored.slice(0, -2) + "AA", env)).toThrow();
  });

  it("refuses to encrypt without a valid key", () => {
    expect(() => encryptSecret("x", {})).toThrow(/TOKEN_ENCRYPTION_KEY/);
    expect(() => encryptSecret("x", { TOKEN_ENCRYPTION_KEY: "short" })).toThrow(/32 bytes/);
  });
});
