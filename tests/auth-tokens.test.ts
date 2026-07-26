import { describe, it, expect, afterAll } from "vitest";
import { randomUUID, randomBytes } from "node:crypto";

import {
  createUser,
  setEmailVerificationToken,
  verifyEmailByToken,
  setPasswordResetToken,
  getUserByPasswordResetToken,
  resetPassword,
  getUserById,
} from "@/lib/db";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("email verification", () => {
  it("new users default to unverified", async () => {
    const id = randomUUID();
    await createUser({ id, email: `verify-${id}@example.com`, passwordHash: "x" });
    const user = await getUserById(id);
    expect(user?.email_verified).toBe(false);
  });

  it("createUser can set emailVerified true directly (no email service configured case)", async () => {
    const id = randomUUID();
    await createUser({ id, email: `verify-${id}@example.com`, passwordHash: "x", emailVerified: true });
    const user = await getUserById(id);
    expect(user?.email_verified).toBe(true);
  });

  it("verifying a valid token marks the user verified and clears the token", async () => {
    const id = randomUUID();
    await createUser({ id, email: `verify-${id}@example.com`, passwordHash: "x" });
    const token = randomBytes(16).toString("hex");
    await setEmailVerificationToken(id, token, new Date(Date.now() + 60_000));

    const verified = await verifyEmailByToken(token);
    expect(verified?.id).toBe(id);
    expect(verified?.email_verified).toBe(true);

    const user = await getUserById(id);
    expect(user?.email_verification_token).toBeNull();
  });

  it("rejects an expired token", async () => {
    const id = randomUUID();
    await createUser({ id, email: `verify-${id}@example.com`, passwordHash: "x" });
    const token = randomBytes(16).toString("hex");
    await setEmailVerificationToken(id, token, new Date(Date.now() - 60_000)); // already expired

    const verified = await verifyEmailByToken(token);
    expect(verified).toBeUndefined();

    const user = await getUserById(id);
    expect(user?.email_verified).toBe(false);
  });

  it("rejects an unknown token", async () => {
    const verified = await verifyEmailByToken("not-a-real-token");
    expect(verified).toBeUndefined();
  });

  it("a token cannot be reused after successful verification", async () => {
    const id = randomUUID();
    await createUser({ id, email: `verify-${id}@example.com`, passwordHash: "x" });
    const token = randomBytes(16).toString("hex");
    await setEmailVerificationToken(id, token, new Date(Date.now() + 60_000));

    const first = await verifyEmailByToken(token);
    expect(first?.id).toBe(id);

    const second = await verifyEmailByToken(token);
    expect(second).toBeUndefined();
  });
});

describe("password reset", () => {
  it("finds a user by a valid reset token", async () => {
    const id = randomUUID();
    await createUser({ id, email: `reset-${id}@example.com`, passwordHash: "old-hash" });
    const token = randomBytes(16).toString("hex");
    await setPasswordResetToken(id, token, new Date(Date.now() + 60_000));

    const found = await getUserByPasswordResetToken(token);
    expect(found?.id).toBe(id);
  });

  it("rejects an expired reset token", async () => {
    const id = randomUUID();
    await createUser({ id, email: `reset-${id}@example.com`, passwordHash: "old-hash" });
    const token = randomBytes(16).toString("hex");
    await setPasswordResetToken(id, token, new Date(Date.now() - 60_000));

    const found = await getUserByPasswordResetToken(token);
    expect(found).toBeUndefined();
  });

  it("resetPassword changes the password hash and clears the token", async () => {
    const id = randomUUID();
    await createUser({ id, email: `reset-${id}@example.com`, passwordHash: "old-hash" });
    const token = randomBytes(16).toString("hex");
    await setPasswordResetToken(id, token, new Date(Date.now() + 60_000));

    await resetPassword(id, "new-hash");

    const user = await getUserById(id);
    expect(user?.password_hash).toBe("new-hash");
    expect(user?.password_reset_token).toBeNull();
  });

  it("a used reset token can't be looked up again", async () => {
    const id = randomUUID();
    await createUser({ id, email: `reset-${id}@example.com`, passwordHash: "old-hash" });
    const token = randomBytes(16).toString("hex");
    await setPasswordResetToken(id, token, new Date(Date.now() + 60_000));
    await resetPassword(id, "new-hash");

    const found = await getUserByPasswordResetToken(token);
    expect(found).toBeUndefined();
  });
});
