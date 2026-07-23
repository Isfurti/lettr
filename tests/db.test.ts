import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

import {
  createUser,
  getUserByEmail,
  upsertResume,
  getResume,
  listResumesForUser,
  deleteResume,
} from "@/lib/db";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("users", () => {
  it("creates and retrieves a user by email", async () => {
    const id = randomUUID();
    const email = `test-${id}@example.com`;
    await createUser({ id, email, passwordHash: "hashed", name: "Test User" });
    const user = await getUserByEmail(email);
    expect(user?.id).toBe(id);
    expect(user?.name).toBe("Test User");
  });

  it("returns undefined for unknown email", async () => {
    expect(await getUserByEmail(`nope-${randomUUID()}@example.com`)).toBeUndefined();
  });
});

describe("resumes", () => {
  const userId = randomUUID();

  beforeAll(async () => {
    await createUser({ id: userId, email: `resumeuser-${userId}@example.com`, passwordHash: "x" });
  });

  it("creates and fetches a resume scoped to the owning user", async () => {
    const id = randomUUID();
    await upsertResume({ id, userId, title: "My Resume", template: "classic", data: JSON.stringify({ foo: "bar" }) });

    const row = await getResume(id, userId);
    expect(row).toBeDefined();
    expect(row?.title).toBe("My Resume");
    expect(JSON.parse(row!.data)).toEqual({ foo: "bar" });
  });

  it("does not return a resume for a different user (ownership isolation)", async () => {
    const id = randomUUID();
    await upsertResume({ id, userId, title: "Private", template: "classic", data: "{}" });
    const otherUserId = randomUUID();
    expect(await getResume(id, otherUserId)).toBeUndefined();
  });

  it("updates in place on upsert with same id", async () => {
    const id = randomUUID();
    await upsertResume({ id, userId, title: "V1", template: "classic", data: "{}" });
    await upsertResume({ id, userId, title: "V2", template: "modern", data: "{}" });

    const row = await getResume(id, userId);
    expect(row?.title).toBe("V2");
    expect(row?.template).toBe("modern");
  });

  it("lists only resumes for the given user", async () => {
    const before = (await listResumesForUser(userId)).length;
    await upsertResume({ id: randomUUID(), userId, title: "A", template: "classic", data: "{}" });
    await upsertResume({ id: randomUUID(), userId, title: "B", template: "classic", data: "{}" });
    expect((await listResumesForUser(userId)).length).toBe(before + 2);
  });

  it("deletes a resume", async () => {
    const id = randomUUID();
    await upsertResume({ id, userId, title: "ToDelete", template: "classic", data: "{}" });
    await deleteResume(id, userId);
    expect(await getResume(id, userId)).toBeUndefined();
  });
});
