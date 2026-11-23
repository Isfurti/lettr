import { describe, it, expect, afterAll, beforeEach, vi } from "vitest";
import { randomUUID } from "node:crypto";
import {
  createUser, deleteUserAccount, upsertResume, saveProfileSettings, shareProfile, getPublicProfileBySlug,
  listProfileReports, listAdminAuditLog, getProfile,
} from "@/lib/db";
import pool from "@/lib/db";
import { listTakenDownProfiles } from "@/lib/db";
import { emptyResume } from "@/lib/types";

const state = { admin: true };
vi.mock("@/lib/admin-auth", () => ({ requireAdminApi: async () => (state.admin ? { id: "admin-1", email: "admin@example.com" } : null) }));

const notify = vi.fn(async () => {});
vi.mock("@/lib/notify", () => ({ notifyAdminOfSupportMessage: (...a: unknown[]) => (notify as (...x: unknown[]) => Promise<void>)(...a) }));
vi.mock("next/server", async (orig) => ({ ...(await orig<typeof import("next/server")>()), after: (fn: () => unknown) => void fn() }));

const made: string[] = [];
beforeEach(() => { state.admin = true; notify.mockClear(); });
const freshIp = () => `10.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;
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
    const ok = await POST(report({ slug, reason: "private_info", details: "shows my number" }, {}, freshIp()));
    expect(ok.status).toBe(200);
    const rows = await reportsFor(userId);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ reason: "private_info", status: "open", user_email: `rep-${userId}@example.com` });

    const dead = await POST(report({ slug: "Z".repeat(22), reason: "spam" }, {}, freshIp()));
    expect(dead.status).toBe(200);
    expect(await dead.json()).toEqual({ ok: true });
    // Only the live link saved a report and sent an email, and the email carries no link or report text.
    expect(notify).toHaveBeenCalledTimes(1);
    const mail = JSON.stringify(notify.mock.calls[0]);
    expect(mail).not.toContain(slug);
    expect(mail).not.toContain("shows my number");
    expect(mail).not.toContain(`rep-${userId}`);
  });

  it("refuses non-JSON bodies and saves nothing for a taken-down link", async () => {
    const { POST } = await import("@/app/api/profile/report/route");
    const take = await import("@/app/api/admin/profiles/[userId]/route");
    const { userId, slug } = await liveProfile();
    const form = new Request("https://example.com/api/profile/report", { method: "POST", body: "a=b", headers: { "content-type": "text/plain", "x-real-ip": freshIp() } });
    expect((await POST(form)).status).toBe(403);
    await take.POST(admin({ action: "disable", reason: "abuse" }), { params: Promise.resolve({ userId }) });
    notify.mockClear();
    expect((await POST(report({ slug, reason: "spam" }, {}, freshIp()))).status).toBe(200);
    expect((await reportsFor(userId)).filter((r) => r.status === "open")).toHaveLength(0);
    expect(notify).not.toHaveBeenCalled();
  });

  it("rejects bad reasons, cross-site requests, and floods", async () => {
    const { POST } = await import("@/app/api/profile/report/route");
    const { slug } = await liveProfile();
    expect((await POST(report({ slug, reason: "nonsense" }, {}, freshIp()))).status).toBe(400);
    expect((await POST(report({ slug, reason: "spam" }, { "sec-fetch-site": "cross-site" }, freshIp()))).status).toBe(403);
    const flood = freshIp();
    let last = 200;
    for (let i = 0; i < 6; i++) last = (await POST(report({ slug, reason: "spam" }, {}, flood))).status;
    expect(last).toBe(429);
  });

  it("an admin takedown hides the page at once, closes reports, is audited, and a restore stays private", async () => {
    const reportRoute = await import("@/app/api/profile/report/route");
    const take = await import("@/app/api/admin/profiles/[userId]/route");
    const { userId, slug } = await liveProfile();
    await reportRoute.POST(report({ slug, reason: "harassment" }, {}, freshIp()));

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

  it("lists taken-down profiles for restore, refuses a restore of a live one, and blocks cross-site admin posts", async () => {
    const take = await import("@/app/api/admin/profiles/[userId]/route");
    const { userId } = await liveProfile();
    const other = await liveProfile();
    expect((await take.POST(admin({ action: "restore" }), { params: Promise.resolve({ userId: other.userId }) })).status).toBe(409);
    const cross = new Request("https://example.com/api/admin", { method: "POST", body: JSON.stringify({ action: "restore" }), headers: { "content-type": "application/json", "sec-fetch-site": "cross-site" } });
    expect((await take.POST(cross, { params: Promise.resolve({ userId }) })).status).toBe(403);
    await take.POST(admin({ action: "disable", reason: "abuse" }), { params: Promise.resolve({ userId }) });
    expect((await listTakenDownProfiles()).some((t) => t.user_id === userId && t.disabled_reason === "abuse")).toBe(true);
    await take.POST(admin({ action: "restore" }), { params: Promise.resolve({ userId }) });
    expect((await listTakenDownProfiles()).some((t) => t.user_id === userId)).toBe(false);
    expect((await listAdminAuditLog(200)).some((l) => l.action === "profile_restored" && l.target_user_id === userId)).toBe(true);
  });

  it("dismissing a report needs an admin and works once", async () => {
    const reportRoute = await import("@/app/api/profile/report/route");
    const dismiss = await import("@/app/api/admin/profile-reports/[id]/route");
    const { userId, slug } = await liveProfile();
    await reportRoute.POST(report({ slug, reason: "spam" }, {}, freshIp()));
    const id = (await reportsFor(userId))[0].id;
    state.admin = false;
    expect((await dismiss.POST(admin({}), { params: Promise.resolve({ id }) })).status).toBe(401);
    state.admin = true;
    expect((await dismiss.POST(admin({}), { params: Promise.resolve({ id }) })).status).toBe(200);
    expect((await dismiss.POST(admin({}), { params: Promise.resolve({ id }) })).status).toBe(404);
    expect((await reportsFor(userId))[0].status).toBe("dismissed");
    expect((await listAdminAuditLog(200)).some((l) => l.action === "profile_report_dismissed" && l.target_user_id === userId)).toBe(true);
  });
});
