import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import {
  createUser, deleteUserAccount, upsertResume, saveProfileSettings, shareProfile, revokeProfile,
  setProfileDisabled, deleteResume, getPublicProfileBySlug, getProfile, setProfilePhoto, getPublicProfilePhoto,
} from "@/lib/db";
import pool from "@/lib/db";
import { emptyResume } from "@/lib/types";

afterAll(async () => {
  await pool.end();
});

async function setup() {
  const userId = randomUUID();
  const resumeId = randomUUID();
  await createUser({ id: userId, email: `profile-${userId}@example.com`, passwordHash: "x" });
  await upsertResume({
    id: resumeId, userId, title: "Mine", template: "classic",
    data: JSON.stringify({ ...emptyResume, contact: { fullName: "Test Person", email: "t@example.com" } }),
  });
  return { userId, resumeId };
}

const settings = (resumeId: string) => ({ resumeId, showCity: false, showLinks: false, showContact: false, showPersonal: false });

describe("profiles", () => {
  it("is private until shared, and a share gives a random link that resolves", async () => {
    const { userId, resumeId } = await setup();
    await saveProfileSettings(userId, settings(resumeId));
    expect((await getProfile(userId))?.shared).toBe(false);

    const shared = await shareProfile(userId, 1);
    expect(shared?.slug).toMatch(/^[A-Za-z0-9_-]{22}$/);
    const found = await getPublicProfileBySlug(shared!.slug!);
    expect(found?.user_id).toBe(userId);
    await deleteUserAccount(userId);
  });

  it("stops resolving after revoke, and a new share gives a different link", async () => {
    const { userId, resumeId } = await setup();
    await saveProfileSettings(userId, settings(resumeId));
    const first = (await shareProfile(userId, 1))!.slug!;
    await revokeProfile(userId);
    expect(await getPublicProfileBySlug(first)).toBeUndefined();
    const second = (await shareProfile(userId, 1))!.slug!;
    expect(second).not.toBe(first);
    expect(await getPublicProfileBySlug(first)).toBeUndefined();
    await deleteUserAccount(userId);
  });

  it("refuses sharing a resume that belongs to someone else", async () => {
    const a = await setup();
    const b = await setup();
    expect(await saveProfileSettings(a.userId, settings(b.resumeId))).toBeUndefined();
    await deleteUserAccount(a.userId);
    await deleteUserAccount(b.userId);
  });

  it("an admin takedown hides the page and blocks re-sharing until restored", async () => {
    const { userId, resumeId } = await setup();
    await saveProfileSettings(userId, settings(resumeId));
    const slug = (await shareProfile(userId, 1))!.slug!;
    await setProfileDisabled(userId, "reported");
    expect(await getPublicProfileBySlug(slug)).toBeUndefined();
    expect(await shareProfile(userId, 1)).toBeUndefined();
    await setProfileDisabled(userId, null);
    expect(await shareProfile(userId, 1)).toBeDefined();
    await deleteUserAccount(userId);
  });

  it("serves the photo only for a live link, and deleting the account removes the page", async () => {
    const { userId, resumeId } = await setup();
    await saveProfileSettings(userId, settings(resumeId));
    await setProfilePhoto(userId, Buffer.from([1, 2, 3]), "image/jpeg", "etag1");
    const slug = (await shareProfile(userId, 1))!.slug!;
    expect((await getPublicProfilePhoto(slug))?.mime).toBe("image/jpeg");
    await revokeProfile(userId);
    expect(await getPublicProfilePhoto(slug)).toBeUndefined();
    const live = (await shareProfile(userId, 1))!.slug!;
    await deleteUserAccount(userId);
    expect(await getPublicProfileBySlug(live)).toBeUndefined();
    expect(await getProfile(userId)).toBeUndefined();
  });

  it("refuses a tailored version as the profile resume", async () => {
    const { userId, resumeId } = await setup();
    const versionId = randomUUID();
    await pool.query(
      "INSERT INTO resumes (id, user_id, title, template, data, parent_id) VALUES ($1,$2,'v','classic','{}'::jsonb,$3)",
      [versionId, userId, resumeId]
    );
    expect(await saveProfileSettings(userId, settings(versionId))).toBeUndefined();
    await deleteUserAccount(userId);
  });

  it("deleting the profile resume closes the link, and picking another resume needs a fresh share", async () => {
    const { userId, resumeId } = await setup();
    await saveProfileSettings(userId, settings(resumeId));
    const old = (await shareProfile(userId, 1))!.slug!;
    await deleteResume(resumeId, userId);
    expect(await getPublicProfileBySlug(old)).toBeUndefined();

    const other = randomUUID();
    await upsertResume({ id: other, userId, title: "B", template: "classic", data: JSON.stringify(emptyResume) });
    const after = await saveProfileSettings(userId, settings(other));
    expect(after?.shared).toBe(false);
    expect(after?.slug).toBeNull();
    expect(await getPublicProfileBySlug(old)).toBeUndefined();
    await deleteUserAccount(userId);
  });

  it("sharing twice keeps the same link", async () => {
    const { userId, resumeId } = await setup();
    await saveProfileSettings(userId, settings(resumeId));
    const a = (await shareProfile(userId, 1))!.slug;
    const b = (await shareProfile(userId, 1))!.slug;
    expect(b).toBe(a);
    await deleteUserAccount(userId);
  });

  it("refuses unsafe photo types and sizes", async () => {
    const { userId, resumeId } = await setup();
    await saveProfileSettings(userId, settings(resumeId));
    expect(await setProfilePhoto(userId, Buffer.from("<svg/>"), "image/svg+xml", "e")).toBe(false);
    expect(await setProfilePhoto(userId, Buffer.alloc(400_000), "image/jpeg", "e")).toBe(false);
    expect(await setProfilePhoto(userId, Buffer.from([1]), "image/webp", "e")).toBe(true);
    await deleteUserAccount(userId);
  });

  it("rejects malformed slugs without querying", async () => {
    expect(await getPublicProfileBySlug("short")).toBeUndefined();
    expect(await getPublicProfileBySlug("../../etc/passwd-padding-padding")).toBeUndefined();
  });
});
