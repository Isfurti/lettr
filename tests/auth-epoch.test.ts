import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import pool, { createUser, getAuthEpoch, getUserByEmail, resetPassword } from "@/lib/db";
import { findOrCreateOAuthUser } from "@/lib/oauth-user";

afterAll(async () => {
  await pool.end();
});

describe("pre-registered account takeover", () => {
  it("an OAuth sign-in on an unverified password account cancels that password and old sessions", async () => {
    const email = `victim-${randomUUID()}@example.com`;
    const id = randomUUID();
    const attackerHash = await bcrypt.hash("attacker-password", 4);
    await createUser({ id, email, passwordHash: attackerHash }); // unverified, made by someone else
    const before = (await getAuthEpoch(id))!;

    const claimed = await findOrCreateOAuthUser(email, "Real Owner");

    expect(claimed.id).toBe(id);
    expect(claimed.email_verified).toBe(true);
    expect(await getAuthEpoch(id)).toBe(before + 1);
    const stored = (await getUserByEmail(email))!;
    expect(await bcrypt.compare("attacker-password", stored.password_hash)).toBe(false);
  });

  it("leaves an already verified account alone", async () => {
    const email = `verified-${randomUUID()}@example.com`;
    const id = randomUUID();
    const hash = await bcrypt.hash("owner-password", 4);
    await createUser({ id, email, passwordHash: hash, emailVerified: true });
    await findOrCreateOAuthUser(email, "Same Owner");
    const stored = (await getUserByEmail(email))!;
    expect(stored.password_hash).toBe(hash);
    expect(stored.auth_epoch).toBe(0);
  });
});

describe("session counter", () => {
  it("starts at 0, moves on a password reset, and is null for a deleted account", async () => {
    const id = randomUUID();
    await createUser({ id, email: `epoch-${id}@example.com`, passwordHash: "x" });
    expect(await getAuthEpoch(id)).toBe(0);
    await resetPassword(id, "new-hash");
    expect(await getAuthEpoch(id)).toBe(1);
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    expect(await getAuthEpoch(id)).toBeNull();
  });
});

describe("reset links are single use", () => {
  it("only one of two simultaneous resets with the same link succeeds", async () => {
    const { setPasswordResetToken, resetPasswordWithToken } = await import("@/lib/db");
    const id = randomUUID();
    await createUser({ id, email: `reset-${id}@example.com`, passwordHash: "old" });
    await setPasswordResetToken(id, "link-token", new Date(Date.now() + 60_000));
    const results = await Promise.all([resetPasswordWithToken("link-token", "hash-a"), resetPasswordWithToken("link-token", "hash-b")]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(await resetPasswordWithToken("link-token", "hash-c")).toBe(false);
    expect(await getAuthEpoch(id)).toBe(1);
  });
  it("an expired link does nothing", async () => {
    const { setPasswordResetToken, resetPasswordWithToken } = await import("@/lib/db");
    const id = randomUUID();
    await createUser({ id, email: `reset2-${id}@example.com`, passwordHash: "old" });
    await setPasswordResetToken(id, "old-link", new Date(Date.now() - 1000));
    expect(await resetPasswordWithToken("old-link", "h")).toBe(false);
  });
});
