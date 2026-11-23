import { describe, it, expect, afterAll, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createUser, deleteUserAccount, upsertResume, getPublicProfileBySlug, setProfileDisabled } from "@/lib/db";
import pool from "@/lib/db";
import { emptyResume } from "@/lib/types";

const state = { userId: "" };
vi.mock("@/lib/auth", () => ({ auth: async () => (state.userId ? { user: { id: state.userId } } : null) }));

afterAll(async () => {
  await pool.end();
});

const json = (body: unknown) => new Request("https://example.com/api", { method: "POST", body: JSON.stringify(body) });
const settings = (resumeId: string, over = {}) => ({ resumeId, showCity: false, showLinks: false, showContact: false, showPersonal: false, ...over });

async function setup(name = "Test Person") {
  const userId = randomUUID();
  const resumeId = randomUUID();
  await createUser({ id: userId, email: `api-${userId}@example.com`, passwordHash: "x" });
  await upsertResume({
    id: resumeId, userId, title: "Mine", template: "classic",
    data: JSON.stringify({ ...emptyResume, contact: { fullName: name, email: "t@example.com" } }),
  });
  state.userId = userId;
  return { userId, resumeId };
}

describe("profile API", () => {
  it("needs a signed-in user", async () => {
    state.userId = "";
    const { GET } = await import("@/app/api/profile/route");
    expect((await GET()).status).toBe(401);
    const share = await import("@/app/api/profile/share/route");
    expect((await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).status).toBe(401);
  });

  it("saves settings without publishing, then shares only with the tick, and revoke kills the link", async () => {
    const { userId, resumeId } = await setup();
    const route = await import("@/app/api/profile/route");
    const share = await import("@/app/api/profile/share/route");
    const revoke = await import("@/app/api/profile/revoke/route");

    const put = await route.PUT(new Request("https://example.com/api/profile", { method: "PUT", body: JSON.stringify(settings(resumeId)) }));
    expect(put.status).toBe(200);
    expect((await put.json()).profile.shared).toBe(false);

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

    expect((await revoke.POST()).status).toBe(200);
    expect(await getPublicProfileBySlug(slug)).toBeUndefined();
    await deleteUserAccount(userId);
  });

  it("will not share a resume with no name, a stranger's resume, or a taken-down profile", async () => {
    const empty = await setup("");
    const route = await import("@/app/api/profile/route");
    const share = await import("@/app/api/profile/share/route");
    await route.PUT(new Request("https://example.com/api/profile", { method: "PUT", body: JSON.stringify(settings(empty.resumeId)) }));
    expect((await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).status).toBe(400);

    const other = await setup();
    const steal = await route.PUT(new Request("https://example.com/api/profile", { method: "PUT", body: JSON.stringify(settings(empty.resumeId)) }));
    expect(steal.status).toBe(400); // other user cannot pick the first user's resume

    await route.PUT(new Request("https://example.com/api/profile", { method: "PUT", body: JSON.stringify(settings(other.resumeId)) }));
    await setProfileDisabled(other.userId, "reported");
    expect((await share.POST(json({ ageConfirmed: true, consentVersion: 1 }))).status).toBe(403);

    await deleteUserAccount(empty.userId);
    await deleteUserAccount(other.userId);
  });
});
