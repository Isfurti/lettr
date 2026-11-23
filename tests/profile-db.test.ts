import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import {
  createUser, deleteUserAccount, upsertResume, saveProfileSettings, shareProfile, revokeProfile,
  setProfileDisabled, getPublicProfileBySlug, getProfile, setProfilePhoto, getPublicProfilePhoto,
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

const settings = (resumeId: string) => ({ resumeId, showCity: false, showLinks: false, showContact: false });

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

  it("rejects malformed slugs without querying", async () => {
    expect(await getPublicProfileBySlug("short")).toBeUndefined();
    expect(await getPublicProfileBySlug("../../etc/passwd-padding-padding")).toBeUndefined();
  });
});
