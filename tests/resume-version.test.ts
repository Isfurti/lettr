import { describe, expect, it, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import pool, { createUser, upsertResume, getResume } from "@/lib/db";
import {
  CURRENT_RESUME_VERSION,
  isNewerThanSupported,
  parseStoredResume,
  prepareResumeJsonForSave,
  upgradeResumeData,
  versionOf,
} from "@/lib/resume-version";
import { emptyResume } from "@/lib/types";

afterAll(async () => {
  await pool.end();
});

// A resume saved before versions existed.
const OLD = { contact: { fullName: "Asha", email: "a@example.com" }, summary: "Hi", experience: [], education: [], skills: ["SQL"] };

describe("resume data versions", () => {
  it("upgrades a resume saved without a version, keeping its content", () => {
    const up = upgradeResumeData(OLD);
    expect(up.version).toBe(CURRENT_RESUME_VERSION);
    expect(up.contact.fullName).toBe("Asha");
    expect(up.skills).toEqual(["SQL"]);
  });

  it("does not change the object it was given", () => {
    const copy = JSON.parse(JSON.stringify(OLD));
    upgradeResumeData(copy);
    expect(copy).toEqual(OLD);
  });

  it("leaves data from a newer version untouched, on read and on save", () => {
    const future = { ...OLD, version: CURRENT_RESUME_VERSION + 5, newThing: true };
    expect(upgradeResumeData(future)).toEqual(future);
    expect(JSON.parse(prepareResumeJsonForSave(JSON.stringify(future)))).toEqual(future);
    expect(isNewerThanSupported(future)).toBe(true);
    expect(isNewerThanSupported(OLD)).toBe(false);
  });

  it("reads odd version values as 0", () => {
    for (const v of ["x", -3, null, NaN, undefined]) expect(versionOf({ version: v })).toBe(0);
    expect(versionOf({ version: 1.9 })).toBe(1);
    expect(versionOf([1])).toBe(0);
    expect(versionOf(null)).toBe(0);
  });

  it("throws on data that isn't an object instead of calling it a resume", () => {
    expect(() => upgradeResumeData(null)).toThrow(TypeError);
    expect(() => upgradeResumeData([1, 2])).toThrow(TypeError);
    expect(prepareResumeJsonForSave("not json")).toBe("not json");
    expect(prepareResumeJsonForSave("[1,2]")).toBe("[1,2]");
  });

  it("copies nested data, so a step can't change the caller's object", () => {
    const steps = [(d: Record<string, unknown>) => { (d.contact as { fullName: string }).fullName = "CHANGED"; return d; }];
    const input = JSON.parse(JSON.stringify(OLD));
    upgradeResumeData(input, steps, 1);
    expect(input.contact.fullName).toBe("Asha");
  });

  it("runs every step from the version the data claims (a made-up version 2)", () => {
    const steps = [
      (d: Record<string, unknown>) => ({ ...d, a: true }), // 0 -> 1
      (d: Record<string, unknown>) => ({ ...d, b: true }), // 1 -> 2
    ];
    expect(upgradeResumeData(OLD, steps, 2)).toMatchObject({ a: true, b: true, version: 2 });
    const fromOne = upgradeResumeData({ ...OLD, version: 1 }, steps, 2) as unknown as Record<string, unknown>;
    expect(fromOne.a).toBeUndefined(); // already past step 0
    expect(fromOne).toMatchObject({ b: true, version: 2 });
  });

  it("parseStoredResume reads old JSON", () => {
    expect(parseStoredResume(JSON.stringify(OLD)).version).toBe(CURRENT_RESUME_VERSION);
  });

  it("stamps the version when a resume is saved, and reads old rows fine", async () => {
    const userId = randomUUID();
    await createUser({ id: userId, email: `ver-${userId}@example.com`, passwordHash: "x" });
    const newId = randomUUID();
    await upsertResume({ id: newId, userId, title: "New", template: "classic", data: JSON.stringify(emptyResume) });
    const saved = await getResume(newId, userId);
    expect(JSON.parse(saved!.data).version).toBe(CURRENT_RESUME_VERSION);
    // Old-shape data from a stale tab is upgraded on save, not just labelled.
    const staleId = randomUUID();
    await upsertResume({ id: staleId, userId, title: "Stale", template: "classic", data: JSON.stringify(OLD) });
    expect(JSON.parse((await getResume(staleId, userId))!.data)).toMatchObject({ summary: "Hi", version: CURRENT_RESUME_VERSION });

    // A row written directly, the way every row looked before this change.
    const oldId = randomUUID();
    await pool.query("INSERT INTO resumes (id, user_id, title, template, data) VALUES ($1,$2,'Old','classic',$3::jsonb)", [
      oldId,
      userId,
      JSON.stringify(OLD),
    ]);
    const old = await getResume(oldId, userId);
    expect(JSON.parse(old!.data).version).toBeUndefined();
    expect(parseStoredResume(old!.data).version).toBe(CURRENT_RESUME_VERSION);
  });
});
