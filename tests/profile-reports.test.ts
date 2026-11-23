import { describe, it, expect, afterAll, vi } from "vitest";
import { randomUUID } from "node:crypto";
import {
  createUser, deleteUserAccount, upsertResume, saveProfileSettings, shareProfile, getPublicProfileBySlug,
  listProfileReports, listAdminAuditLog, getProfile,
} from "@/lib/db";
import pool from "@/lib/db";
import { emptyResume } from "@/lib/types";

const state = { admin: true };
vi.mock("@/lib/admin-auth", () => ({ requireAdminApi: async () => (state.admin ? { id: "admin-1", email: "admin@example.com" } : null) }));

const made: string[] = [];
afterAll(async () => {
  for (const id of made) await deleteUserAccount(id).catch(() => {});
  await pool.end();
});

async function liveProfile() {
  const userId = randomUUID();
  const resumeId = randomUUID();
  made.push(userId);
  await createUser({ id: userId, email: `rep-${userId}@example.com`, passwordHash: "x" });
  await upsertResume({ id: resumeId, userId, title: "R", template: "classic", data: JSON.stringify({ ...emptyResume, contact: { fullName: "Reported Person", email: "r@example.com" } }) });
  await saveProfileSettings(userId, { resumeId, showCity: false, showLinks: false, showContact: false, showPersonal: false });
  const slug = (await shareProfile(userId, 1, resumeId))!.slug!;
  return { userId, resumeId, slug };
}

const report = (body: unknown, headers: Record<string, string> = {}, ip = "9.9.9.9") =>
  new Request("https://example.com/api/profile/report", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", "x-real-ip": ip, ...headers } });
const admin = (body: unknown) => new Request("https://example.com/api/admin", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json" } });
const reportsFor = async (userId: string) => (await listProfileReports(500)).filter((r) => r.profile_user_id === userId);

describe("profile reports", () => {
  it("saves a report for a live link and gives the same answer for a dead one", async () => {
    const { POST } = await import("@/app/api/profile/report/route");
    const { userId, slug } = await liveProfile();
    const ok = await POST(report({ slug, reason: "private_info", details: "shows my number" }, {}, "1.1.1.1"));
    expect(ok.status).toBe(200);
    const rows = await reportsFor(userId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ reason: "private_info", status: "open", user_email: `rep-${userId}@example.com` });

    const dead = await POST(report({ slug: "Z".repeat(22), reason: "spam" }, {}, "1.1.1.2"));
    expect(dead.status).toBe(200);
    expect(await dead.json()).toEqual({ ok: true });
  });

  it("rejects bad reasons, cross-site requests, and floods", async () => {
    const { POST } = await import("@/app/api/profile/report/route");
    const { slug } = await liveProfile();
    expect((await POST(report({ slug, reason: "nonsense" }, {}, "2.2.2.1"))).status).toBe(400);
    expect((await POST(report({ slug, reason: "spam" }, { "sec-fetch-site": "cross-site" }, "2.2.2.2"))).status).toBe(403);
    let last = 200;
    for (let i = 0; i < 6; i++) last = (await POST(report({ slug, reason: "spam" }, {}, "2.2.2.3"))).status;
    expect(last).toBe(429);
  });

  it("an admin takedown hides the page at once, closes reports, is audited, and a restore stays private", async () => {
    const reportRoute = await import("@/app/api/profile/report/route");
    const take = await import("@/app/api/admin/profiles/[userId]/route");
    const { userId, slug } = await liveProfile();
    await reportRoute.POST(report({ slug, reason: "harassment" }, {}, "3.3.3.1"));

    state.admin = false;
    expect((await take.POST(admin({ action: "disable", reason: "abuse" }), { params: Promise.resolve({ userId }) })).status).toBe(401);
    state.admin = true;
    expect((await take.POST(admin({ action: "disable", reason: "x" }), { params: Promise.resolve({ userId }) })).status).toBe(400);

    expect((await take.POST(admin({ action: "disable", reason: "harassment confirmed" }), { params: Promise.resolve({ userId }) })).status).toBe(200);
    expect(await getPublicProfileBySlug(slug)).toBeUndefined();
    expect((await reportsFor(userId))[0].status).toBe("actioned");
    expect((await listAdminAuditLog(100)).some((l) => l.action === "profile_taken_down" && l.target_user_id === userId)).toBe(true);

    expect((await take.POST(admin({ action: "restore" }), { params: Promise.resolve({ userId }) })).status).toBe(200);
    const p = await getProfile(userId);
    expect(p?.disabled_at).toBeNull();
    expect(p?.shared).toBe(false);
    expect(await getPublicProfileBySlug(slug)).toBeUndefined();
  });

  it("dismissing a report needs an admin and works once", async () => {
    const reportRoute = await import("@/app/api/profile/report/route");
    const dismiss = await import("@/app/api/admin/profile-reports/[id]/route");
    const { userId, slug } = await liveProfile();
    await reportRoute.POST(report({ slug, reason: "spam" }, {}, "4.4.4.1"));
    const id = (await reportsFor(userId))[0].id;
    state.admin = false;
    expect((await dismiss.POST(admin({}), { params: Promise.resolve({ id }) })).status).toBe(401);
    state.admin = true;
    expect((await dismiss.POST(admin({}), { params: Promise.resolve({ id }) })).status).toBe(200);
    expect((await dismiss.POST(admin({}), { params: Promise.resolve({ id }) })).status).toBe(404);
    expect((await reportsFor(userId))[0].status).toBe("dismissed");
  });
});
