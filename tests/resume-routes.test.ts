import { describe, expect, it, afterAll, vi, beforeEach } from "vitest";
import { randomUUID } from "node:crypto";

// Fake signed-in session; the routes themselves are the real ones.
const session = { user: { id: "", email: "route-test@example.com" } };
vi.mock("@/lib/auth", () => ({ auth: async () => (session.user.id ? session : null) }));

import pool, { createUser, getResume, upsertResume } from "@/lib/db";
import { PUT as putResume, GET as getResumeRoute } from "@/app/api/resumes/[id]/route";
import { POST as postResume } from "@/app/api/resumes/route";
import { CURRENT_RESUME_VERSION } from "@/lib/resume-version";
import { emptyResume } from "@/lib/types";

afterAll(async () => {
  await pool.end();
});

const json = (body: unknown) => new Request("http://test/api", { method: "PUT", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
const ctx = (id: string) => ({ params: Promise.resolve({ id }) });

let userId = "";
let resumeId = "";
beforeEach(async () => {
  userId = randomUUID();
  session.user.id = userId;
  await createUser({ id: userId, email: `routes-${userId}@example.com`, passwordHash: "x" });
  resumeId = randomUUID();
  await upsertResume({ id: resumeId, userId, title: "Mine", template: "classic", data: JSON.stringify(emptyResume) });
});

describe("resume routes and data versions", () => {
  it("PUT answers 409 and changes nothing when the stored resume is from a newer version", async () => {
    const newer = { ...emptyResume, summary: "written by newer code", version: CURRENT_RESUME_VERSION + 3 };
    await pool.query("UPDATE resumes SET data = $1::jsonb WHERE id = $2", [JSON.stringify(newer), resumeId]);

    const res = await putResume(json({ title: "Renamed", data: emptyResume }), ctx(resumeId));
    expect(res.status).toBe(409);
    const row = await getResume(resumeId, userId);
    expect(row!.title).toBe("Mine");
    expect(JSON.parse(row!.data)).toEqual(newer);
  });

  it("PUT and POST answer 400 for a client-sent version newer than supported", async () => {
    const forged = { ...emptyResume, version: 999 };
    expect((await putResume(json({ data: forged }), ctx(resumeId))).status).toBe(400);
    expect(JSON.parse((await getResume(resumeId, userId))!.data).version).toBe(CURRENT_RESUME_VERSION);

    // A user with no resumes yet, so the free plan's resume limit doesn't answer first.
    const fresh = randomUUID();
    await createUser({ id: fresh, email: `fresh-${fresh}@example.com`, passwordHash: "x" });
    session.user.id = fresh;
    const post = await postResume(json({ title: "X", data: forged }));
    expect(post.status).toBe(400);
  });

  it("a normal save works, and a title-only save keeps the content", async () => {
    const withText = { ...emptyResume, summary: "kept", version: CURRENT_RESUME_VERSION };
    expect((await putResume(json({ data: withText }), ctx(resumeId))).status).toBe(200);
    expect((await putResume(json({ title: "New title" }), ctx(resumeId))).status).toBe(200);
    const row = await getResume(resumeId, userId);
    expect(row!.title).toBe("New title");
    expect(JSON.parse(row!.data).summary).toBe("kept");
  });

  it("GET returns the data with its version, and old rows (no version) are upgraded", async () => {
    const old = { contact: { fullName: "A", email: "a@example.com" }, summary: "old", experience: [], education: [], skills: [] };
    await pool.query("UPDATE resumes SET data = $1::jsonb WHERE id = $2", [JSON.stringify(old), resumeId]);
    const res = await getResumeRoute(new Request("http://test/api"), ctx(resumeId));
    const body = await res.json();
    expect(body.data.version).toBe(CURRENT_RESUME_VERSION);
    expect(body.data.summary).toBe("old");
  });

  it("someone else's resume is not found", async () => {
    session.user.id = randomUUID();
    expect((await getResumeRoute(new Request("http://test/api"), ctx(resumeId))).status).toBe(404);
    expect((await putResume(json({ title: "hack" }), ctx(resumeId))).status).toBe(404);
  });
});
