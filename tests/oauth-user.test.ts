import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

import { findOrCreateOAuthUser } from "@/lib/oauth-user";
import { createUser, getUserByEmail } from "@/lib/db";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("findOrCreateOAuthUser", () => {
  it("creates a new user when no account exists for the email", async () => {
    const email = `oauth-${randomUUID()}@example.com`;
    const user = await findOrCreateOAuthUser(email, "New OAuth User");

    expect(user.email).toBe(email);
    expect(user.name).toBe("New OAuth User");
    expect(user.id).toBeTruthy();
  });

  it("creates new OAuth users already email-verified - signing in via Google/LinkedIn IS the verification, there's no separate step possible", async () => {
    const email = `oauth-verified-${randomUUID()}@example.com`;
    const user = await findOrCreateOAuthUser(email, "Verified By OAuth");
    expect(user.email_verified).toBe(true);
  });

  it("returns the same user on a second call with the same email (idempotent)", async () => {
    const email = `oauth-${randomUUID()}@example.com`;
    const first = await findOrCreateOAuthUser(email, "First Call");
    const second = await findOrCreateOAuthUser(email, "First Call");

    expect(second.id).toBe(first.id);
  });

  it("links to an existing credentials-based account with the same email, rather than duplicating", async () => {
    const email = `existing-${randomUUID()}@example.com`;
    const existingId = randomUUID();
    await createUser({ id: existingId, email, passwordHash: "some-real-password-hash", name: "Password User" });

    const linked = await findOrCreateOAuthUser(email, "Google Profile Name");

    expect(linked.id).toBe(existingId);
    // Existing account's original name/password are untouched by the OAuth login
    expect(linked.name).toBe("Password User");
  });

  it("normalizes email case when matching an existing account", async () => {
    const email = `casetest-${randomUUID()}@example.com`;
    const existingId = randomUUID();
    await createUser({ id: existingId, email, passwordHash: "x", name: "Case Test" });

    const linked = await findOrCreateOAuthUser(email.toUpperCase(), "Different Case");
    expect(linked.id).toBe(existingId);
  });

  it("stores a new OAuth-only account with a non-empty, unusable password hash (not blank)", async () => {
    const email = `hashcheck-${randomUUID()}@example.com`;
    await findOrCreateOAuthUser(email, "Hash Check");
    const stored = await getUserByEmail(email);
    expect(stored?.password_hash).toBeTruthy();
    expect(stored?.password_hash.length).toBeGreaterThan(20); // real bcrypt hash, not empty/placeholder
  });

  it("handles a missing name gracefully", async () => {
    const email = `noname-${randomUUID()}@example.com`;
    const user = await findOrCreateOAuthUser(email, null);
    expect(user.email).toBe(email);
  });
});
