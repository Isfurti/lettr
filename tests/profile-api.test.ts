import { describe, it, expect, afterAll, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createUser, deleteUserAccount, upsertResume, getPublicProfileBySlug, setProfileDisabled, shareProfile, saveProfileSettings } from "@/lib/db";
import pool from "@/lib/db";
import { emptyResume } from "@/lib/types";

const state = { userId: "" };
vi.mock("@/lib/auth", () => ({ auth: async () => (state.userId ? { user: { id: state.userId } } : null) }));

afterAll(async () => {
  for (const id of made) await deleteUserAccount(id).catch(() => {});
  await pool.end();
});

const json = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://example.com/api", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } });
const put = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("https://example.com/api/profile", { method: "PUT", body: JSON.stringify(body), headers: { "content-type": "application/json", ...headers } });
const post = (headers: Record<string, string> = {}) => new Request("https://example.com/api/profile/revoke", { method: "POST", headers });
const made: string[] = [];
const settings = (resumeId: string, over: Record<string, boolean> = {}) => ({ resumeId, showCity: false, showLinks: false, showContact: false, showPersonal: false, ...over });

async function setup(name = "Test Person") {
  const userId = randomUUID();
  const resumeId = randomUUID();
  await createUser({ id: userId, email: `api-${userId}@example.com`, passwordHash: "x" });
  await upsertResume({
    id: resumeId, userId, title: "Mine", template: "classic",
    data: JSON.stringify({ ...emptyResume, contact: { fullName: name, email: "t@example.com" } }),
  });
  state.userId = userId;
  made.push(userId);
  return { userId, resumeId };
}

describe("profile API", () => {
  it("needs a signed-in user", async () => {
    state.userId = "";
    const { GET } = await import("@/app/api/profile/route");
    expect((await GET()).status).toBe(401);
    const share = await import("@/app/api/profile/share/route");
    expect((await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).status).toBe(401);
    expect((await (await import("@/app/api/profile/route")).PUT(put({}))).status).toBe(401);
    expect((await (await import("@/app/api/profile/revoke/route")).POST(post())).status).toBe(401);
  });

  it("refuses cross-site and non-JSON requests", async () => {
    const { resumeId } = await setup();
    const route = await import("@/app/api/profile/route");
    const share = await import("@/app/api/profile/share/route");
    const revoke = await import("@/app/api/profile/revoke/route");
    await route.PUT(put(settings(resumeId)));
    const body = { ageConfirmed: true, consentVersion: 1 };
    expect((await share.POST(json(body, { "sec-fetch-site": "cross-site" }))).status).toBe(403);
    expect((await share.POST(json(body, { origin: "https://evil.example" }))).status).toBe(403);
    expect((await share.POST(new Request("https://example.com/api", { method: "POST", body: JSON.stringify(body), headers: { "content-type": "text/plain" } }))).status).toBe(403);
    expect((await route.PUT(put(settings(resumeId), { "sec-fetch-site": "cross-site" }))).status).toBe(403);
    expect((await revoke.POST(post({ "sec-fetch-site": "cross-site" }))).status).toBe(403);
    expect((await share.POST(json(body, { "sec-fetch-site": "same-origin" }))).status).toBe(200);
  });

  it("saves settings without publishing, then shares only with the tick, and revoke kills the link", async () => {
    const { userId, resumeId } = await setup();
    const route = await import("@/app/api/profile/route");
    const share = await import("@/app/api/profile/share/route");
    const revoke = await import("@/app/api/profile/revoke/route");

    const saved = await route.PUT(put(settings(resumeId)));
    expect(saved.status).toBe(200);
    expect((await saved.json()).profile.shared).toBe(false);

    // no tick, wrong consent version: refused
    expect((await share.POST(json({ ageConfirmed: false, consentVersion: 1 }))).status).toBe(400);
    expect((await share.POST(json({ ageConfirmed: true, consentVersion: 99 }))).status).toBe(400);
    expect((await share.POST(json({}))).status).toBe(400);

    const ok = await share.POST(json({ ageConfirmed: true, consentVersion: 1 }));
    expect(ok.status).toBe(200);
    const url: string = (await ok.json()).url;
    const slug = url.split("/p/")[1];
    expect(slug).toMatch(/^[A-Za-z0-9_-]{22}$/);
    expect((await getPublicProfileBySlug(slug))?.user_id).toBe(userId);

    // sharing again keeps the same link
    expect((await (await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).json()).url).toBe(url);

    expect((await revoke.POST(post())).status).toBe(200);
    expect(await getPublicProfileBySlug(slug)).toBeUndefined();
    await deleteUserAccount(userId);
  });

  it("will not share a resume with no name, a stranger's resume, or a taken-down profile", async () => {
    const empty = await setup("");
    const route = await import("@/app/api/profile/route");
    const share = await import("@/app/api/profile/share/route");
    await route.PUT(put(settings(empty.resumeId)));
    expect((await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).status).toBe(400);

    const other = await setup();
    const steal = await route.PUT(put(settings(empty.resumeId)));
    expect(steal.status).toBe(400); // other user cannot pick the first user's resume

    await route.PUT(put(settings(other.resumeId)));
    await setProfileDisabled(other.userId, "reported");
    expect((await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).status).toBe(403);

    await deleteUserAccount(empty.userId);
    await deleteUserAccount(other.userId);
  });

  it("keeps the link when the same resume is saved again, and drops it when another is chosen", async () => {
    const { userId, resumeId } = await setup();
    const route = await import("@/app/api/profile/route");
    const share = await import("@/app/api/profile/share/route");
    await route.PUT(put(settings(resumeId)));
    const url: string = (await (await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).json()).url;
    const slug = url.split("/p/")[1];

    const same = await (await route.PUT(put(settings(resumeId, { showCity: true })))).json();
    expect(same.profile.url).toBe(url);

    const second = randomUUID();
    await upsertResume({ id: second, userId, title: "B", template: "classic", data: JSON.stringify({ ...emptyResume, contact: { fullName: "B", email: "b@example.com" } }) });
    const moved = await (await route.PUT(put(settings(second)))).json();
    expect(moved.profile.shared).toBe(false);
    expect(await getPublicProfileBySlug(slug)).toBeUndefined();
  });

  it("rejects a tailored version, bad JSON, no profile, and a string consent version", async () => {
    const { userId, resumeId } = await setup();
    const route = await import("@/app/api/profile/route");
    const share = await import("@/app/api/profile/share/route");
    const versionId = randomUUID();
    await pool.query("INSERT INTO resumes (id, user_id, title, template, data, parent_id) VALUES ($1,$2,'v','classic','{}'::jsonb,$3)", [versionId, userId, resumeId]);
    expect((await route.PUT(put(settings(versionId)))).status).toBe(400);
    expect((await route.PUT(new Request("https://example.com/api/profile", { method: "PUT", body: "{nope", headers: { "content-type": "application/json" } }))).status).toBe(400);
    expect((await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).status).toBe(400); // no profile yet
    await route.PUT(put(settings(resumeId)));
    expect((await share.POST(json({ ageConfirmed: true, consentVersion: "1" }))).status).toBe(400);
  });

  it("shows a takedown without its reason, and a restore does not re-publish", async () => {
    const { userId, resumeId } = await setup();
    const route = await import("@/app/api/profile/route");
    const share = await import("@/app/api/profile/share/route");
    await route.PUT(put(settings(resumeId)));
    await share.POST(json({ ageConfirmed: true, consentVersion: 1 }));
    await setProfileDisabled(userId, "SECRET-REASON harassment report");
    const view = await (await route.GET()).json();
    expect(view.profile.takenDown).toBe(true);
    expect(view.profile.shared).toBe(false);
    expect(JSON.stringify(view)).not.toContain("SECRET-REASON");
    expect((await (await import("@/app/api/profile/revoke/route")).POST(post())).status).toBe(200);
    expect((await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).status).toBe(403);
    expect((await (await route.PUT(put(settings(resumeId)))).json()).profile.shared).toBe(false);
    await setProfileDisabled(userId, null);
    expect((await (await route.GET()).json()).profile.shared).toBe(false);
  });

  it("rate limits new links with a Retry-After, and failed attempts do not use the quota", async () => {
    const { resumeId } = await setup();
    const route = await import("@/app/api/profile/route");
    const share = await import("@/app/api/profile/share/route");
    const revoke = await import("@/app/api/profile/revoke/route");
    // refused attempts (no tick) never reach the limiter; refused-after attempts (no name) are refunded
    await route.PUT(put(settings(resumeId)));
    for (let i = 0; i < 6; i++) {
      expect((await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).status).toBe(200);
      await revoke.POST(post());
    }
    const blocked = await share.POST(json({ ageConfirmed: true, consentVersion: 1 }));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
  });

  it("shareProfile refuses a resume that is no longer the profile resume (race)", async () => {
    const { userId, resumeId } = await setup();
    await saveProfileSettings(userId, { resumeId, showCity: false, showLinks: false, showContact: false, showPersonal: false });
    expect(await shareProfile(userId, 1, randomUUID())).toBeUndefined();
    expect(await shareProfile(userId, 1, resumeId)).toBeDefined();
  });
});
