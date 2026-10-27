import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import pool, { createUser, userExists, saveCachedAiResult, getCachedAiResult } from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("an account deleted while still signed in", () => {
  it("is reported as gone, so the session can be signed out", async () => {
    const id = randomUUID();
    await createUser({ id, email: `gone-${id}@example.com`, passwordHash: "x", countryCode: "IN", pricingTier: "value" });
    expect(await userExists(id)).toBe(true);
    await pool.query("DELETE FROM users WHERE id = $1", [id]);
    expect(await userExists(id)).toBe(false);
  });

  it("can't break an AI result by failing to save it for reuse", async () => {
    const missingUser = randomUUID();
    await expect(saveCachedAiResult(`k-${missingUser}`, missingUser, "import", { ok: true })).resolves.toBeUndefined();
    expect(await getCachedAiResult(`k-${missingUser}`, missingUser)).toBeNull();
  });
});
