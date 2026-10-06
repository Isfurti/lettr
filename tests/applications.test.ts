import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import pool, { createUser, createApplication, listApplications, updateApplication, deleteApplication, upsertResume, deleteUserAccount } from "@/lib/db";
import { canUseInterviewPractice } from "@/lib/limits";

afterAll(async () => {
  await pool.end();
});

async function user() {
  const id = randomUUID();
  await createUser({ id, email: `apps-${id}@example.com`, passwordHash: "x", name: "Apps" });
  return id;
}

describe("job applications", () => {
  it("creates, updates, lists and deletes only the owner's applications", async () => {
    const me = await user();
    const other = await user();
    const resumeId = randomUUID();
    await upsertResume({ id: resumeId, userId: me, title: "Mine", template: "classic", data: "{}" });
    const otherResume = randomUUID();
    await upsertResume({ id: otherResume, userId: other, title: "Theirs", template: "classic", data: "{}" });

    const a = await createApplication(me, { company: "Acme", role: "PM", status: "applied", appliedOn: "2026-10-01", resumeId });
    expect(a).toMatchObject({ company: "Acme", status: "applied", applied_on: "2026-10-01", resume_id: resumeId });

    // Someone else's resume can't be linked.
    const b = await createApplication(me, { company: "Beta", resumeId: otherResume });
    expect(b.resume_id).toBeNull();

    const up = await updateApplication(me, a.id, { status: "interview", nextStep: "Panel round", nextStepOn: "2026-10-09" });
    expect(up).toMatchObject({ status: "interview", next_step: "Panel round", next_step_on: "2026-10-09", role: "PM" });
    expect(await updateApplication(other, a.id, { status: "offer" })).toBeNull();

    expect((await listApplications(me)).map((x) => x.company).sort()).toEqual(["Acme", "Beta"]);
    expect(await listApplications(other)).toEqual([]);
    expect(await deleteApplication(other, a.id)).toBe(false);
    expect(await deleteApplication(me, a.id)).toBe(true);

    await deleteUserAccount(me);
    const left = await pool.query("SELECT 1 FROM job_applications WHERE user_id = $1", [me]);
    expect(left.rowCount).toBe(0);
  });
});

describe("interview practice limits", () => {
  it("gives free users a few sets a month and Pro many more", () => {
    expect(canUseInterviewPractice("free", "set", 1).allowed).toBe(true);
    expect(canUseInterviewPractice("free", "set", 2).allowed).toBe(false);
    expect(canUseInterviewPractice("pro", "set", 39).allowed).toBe(true);
    expect(canUseInterviewPractice("free", "feedback", 15).allowed).toBe(false);
  });
});
