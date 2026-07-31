import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

import { createUser, logAdminAction, listAdminAuditLog, deleteUserAccount, getUserById, upsertResume, getResume, markEmailVerifiedByAdmin, setEmailVerificationToken } from "@/lib/db";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("admin audit log", () => {
  it("logs an admin action and it appears in the log", async () => {
    const adminId = randomUUID();
    const targetId = randomUUID();
    await logAdminAction({ adminUserId: adminId, action: "viewed_user", targetUserId: targetId, detail: "test@example.com" });

    const log = await listAdminAuditLog(50);
    const entry = log.find((l) => l.admin_user_id === adminId && l.target_user_id === targetId);
    expect(entry).toBeDefined();
    expect(entry?.action).toBe("viewed_user");
    expect(entry?.detail).toBe("test@example.com");
  });

  it("returns most recent first", async () => {
    const adminId = randomUUID();
    await logAdminAction({ adminUserId: adminId, action: "action_one" });
    await new Promise((r) => setTimeout(r, 10));
    await logAdminAction({ adminUserId: adminId, action: "action_two" });

    const log = await listAdminAuditLog(50);
    const entries = log.filter((l) => l.admin_user_id === adminId);
    expect(entries[0].action).toBe("action_two");
    expect(entries[1].action).toBe("action_one");
  });

  it("persists the audit record even after the target user is deleted", async () => {
    const adminId = randomUUID();
    const targetId = randomUUID();
    await createUser({ id: targetId, email: `todelete-${targetId}@example.com`, passwordHash: "x" });

    await logAdminAction({ adminUserId: adminId, action: "deleted_account", targetUserId: targetId, detail: "audit survives deletion" });
    await deleteUserAccount(targetId);

    const log = await listAdminAuditLog(50);
    const entry = log.find((l) => l.target_user_id === targetId);
    expect(entry).toBeDefined();
    expect(entry?.detail).toBe("audit survives deletion");
  });
});

describe("markEmailVerifiedByAdmin - fixes accounts stuck in an unverifiable state", () => {
  it("marks an unverified user as verified", async () => {
    const id = randomUUID();
    await createUser({ id, email: `stuck-${id}@example.com`, passwordHash: "x", emailVerified: false });
    expect((await getUserById(id))?.email_verified).toBe(false);

    await markEmailVerifiedByAdmin(id);
    expect((await getUserById(id))?.email_verified).toBe(true);
  });

  it("clears any pending verification token", async () => {
    const id = randomUUID();
    await createUser({ id, email: `stuck2-${id}@example.com`, passwordHash: "x", emailVerified: false });
    await setEmailVerificationToken(id, "some-token", new Date(Date.now() + 60_000));

    await markEmailVerifiedByAdmin(id);

    const user = await getUserById(id);
    expect(user?.email_verified).toBe(true);
    expect(user?.email_verification_token).toBeNull();
  });
});

describe("deleteUserAccount", () => {
  it("removes the user row", async () => {
    const id = randomUUID();
    await createUser({ id, email: `del-${id}@example.com`, passwordHash: "x" });
    await deleteUserAccount(id);
    expect(await getUserById(id)).toBeUndefined();
  });

  it("cascade-deletes the user's resumes", async () => {
    const id = randomUUID();
    await createUser({ id, email: `del-${id}@example.com`, passwordHash: "x" });
    const resumeId = randomUUID();
    await upsertResume({ id: resumeId, userId: id, title: "To be deleted", template: "classic", data: "{}" });

    await deleteUserAccount(id);

    expect(await getResume(resumeId, id)).toBeUndefined();
  });
});
