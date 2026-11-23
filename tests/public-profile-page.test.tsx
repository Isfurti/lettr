import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { createUser, deleteUserAccount, upsertResume, saveProfileSettings, shareProfile, revokeProfile, setProfileDisabled, deleteResume } from "@/lib/db";
import pool from "@/lib/db";
import { emptyResume } from "@/lib/types";
import PublicProfilePage, { generateMetadata } from "@/app/p/[slug]/page";

const made: string[] = [];
afterAll(async () => {
  for (const id of made) await deleteUserAccount(id).catch(() => {});
  await pool.end();
});

const NOT_FOUND = /NEXT_HTTP_ERROR_FALLBACK;404|NEXT_NOT_FOUND/;

async function sharedProfile(name = "Page Person") {
  const userId = randomUUID();
  const resumeId = randomUUID();
  made.push(userId);
  await createUser({ id: userId, email: `page-${userId}@example.com`, passwordHash: "x" });
  await upsertResume({ id: resumeId, userId, title: "R", template: "classic", data: JSON.stringify({ ...emptyResume, contact: { fullName: name, email: "p@example.com" } }) });
  await saveProfileSettings(userId, { resumeId, showCity: false, showLinks: false, showContact: false, showPersonal: false });
  const slug = (await shareProfile(userId, 1, resumeId))!.slug!;
  return { userId, resumeId, slug };
}

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("/p/[slug] page", () => {
  it("is a real 404 for unknown, revoked and malformed links, and never indexable", async () => {
    const { userId, slug } = await sharedProfile();

    await expect(PublicProfilePage(params("A".repeat(22)))).rejects.toThrow(NOT_FOUND);
    await expect(PublicProfilePage(params("short"))).rejects.toThrow(NOT_FOUND);

    expect(await PublicProfilePage(params(slug))).toBeTruthy();
    const meta = await generateMetadata(params(slug));
    expect(meta.robots).toMatchObject({ index: false, follow: false, noarchive: true });
    expect(meta.referrer).toBe("no-referrer");
    expect(String(meta.title)).toContain("Page Person");
    expect(JSON.stringify(meta)).not.toContain("p@example.com");

    await revokeProfile(userId);
    await expect(PublicProfilePage(params(slug))).rejects.toThrow(NOT_FOUND);
    const gone = await generateMetadata(params(slug));
    expect(gone.robots).toMatchObject({ index: false });
    expect(String(gone.title)).toContain("not found");
  });

  it("404s after an admin takedown and after the profile resume is deleted", async () => {
    const a = await sharedProfile();
    await setProfileDisabled(a.userId, "reported");
    await expect(PublicProfilePage(params(a.slug))).rejects.toThrow(NOT_FOUND);

    const b = await sharedProfile();
    await deleteResume(b.resumeId, b.userId);
    await expect(PublicProfilePage(params(b.slug))).rejects.toThrow(NOT_FOUND);
  });

  it("404s when the profile has no name to show", async () => {
    const { slug } = await sharedProfile("");
    await expect(PublicProfilePage(params(slug))).rejects.toThrow(NOT_FOUND);
  });
});
