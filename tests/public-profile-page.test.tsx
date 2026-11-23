import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { createUser, deleteUserAccount, upsertResume, saveProfileSettings, shareProfile, revokeProfile } from "@/lib/db";
import pool from "@/lib/db";
import { emptyResume } from "@/lib/types";
import PublicProfilePage, { generateMetadata } from "@/app/p/[slug]/page";

afterAll(async () => {
  await pool.end();
});

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("/p/[slug] page", () => {
  it("is a real 404 for unknown, revoked and malformed links, and never indexable", async () => {
    const userId = randomUUID();
    const resumeId = randomUUID();
    await createUser({ id: userId, email: `page-${userId}@example.com`, passwordHash: "x" });
    await upsertResume({
      id: resumeId, userId, title: "R", template: "classic",
      data: JSON.stringify({ ...emptyResume, contact: { fullName: "Page Person", email: "p@example.com" } }),
    });
    await saveProfileSettings(userId, { resumeId, showCity: false, showLinks: false, showContact: false, showPersonal: false });
    const slug = (await shareProfile(userId, 1, resumeId))!.slug!;

    await expect(PublicProfilePage(params("A".repeat(22)))).rejects.toThrow();
    await expect(PublicProfilePage(params("short"))).rejects.toThrow();

    const live = await PublicProfilePage(params(slug));
    expect(live).toBeTruthy();
    const meta = await generateMetadata(params(slug));
    expect(meta.robots).toMatchObject({ index: false, follow: false, noarchive: true });
    expect(String(meta.title)).toContain("Page Person");
    expect(JSON.stringify(meta)).not.toContain("p@example.com");

    await revokeProfile(userId);
    await expect(PublicProfilePage(params(slug))).rejects.toThrow();
    const gone = await generateMetadata(params(slug));
    expect(gone.robots).toMatchObject({ index: false });
    expect(String(gone.title)).toContain("not found");
    await deleteUserAccount(userId);
  });
});
