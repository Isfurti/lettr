import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import { createUser, deleteUserAccount, upsertResume, saveProfileSettings, shareProfile, revokeProfile, ensureProfile, setProfilePhoto } from "@/lib/db";
import pool from "@/lib/db";
import { emptyResume } from "@/lib/types";
import { GET } from "@/app/p/[slug]/photo/route";

afterAll(async () => {
  await pool.end();
});

const call = (slug: string, headers: Record<string, string> = {}) =>
  GET(new Request(`https://example.com/p/${slug}/photo`, { headers }), { params: Promise.resolve({ slug }) });

describe("public photo route", () => {
  it("answers only for a live link, with safe headers, 304s, and 404s after revoke", async () => {
    const userId = randomUUID();
    const resumeId = randomUUID();
    await createUser({ id: userId, email: `photo-${userId}@example.com`, passwordHash: "x" });
    await upsertResume({ id: resumeId, userId, title: "R", template: "classic", data: JSON.stringify(emptyResume) });
    await ensureProfile(userId);
    await saveProfileSettings(userId, { resumeId, showCity: false, showLinks: false, showContact: false, showPersonal: false });
    await setProfilePhoto(userId, Buffer.from([0xff, 0xd8, 1, 2, 3]), "image/jpeg", "abc123");

    expect((await call("A".repeat(22))).status).toBe(404);

    const slug = (await shareProfile(userId, 1, resumeId))!.slug!;
    const ok = await call(slug);
    expect(ok.status).toBe(200);
    expect(ok.headers.get("content-type")).toBe("image/jpeg");
    expect(ok.headers.get("x-content-type-options")).toBe("nosniff");
    expect(ok.headers.get("content-security-policy")).toContain("sandbox");
    expect(ok.headers.get("cache-control")).toBe("public, no-cache");

    expect((await call(slug, { "if-none-match": 'W/"abc123"' })).status).toBe(304);

    await revokeProfile(userId);
    const gone = await call(slug);
    expect(gone.status).toBe(404);
    expect(gone.headers.get("cache-control")).toBe("no-store");
    await deleteUserAccount(userId);
  });
});
