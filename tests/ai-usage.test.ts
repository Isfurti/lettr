import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import pool, {
  createUser,
  deleteUserAccount,
  recordAiUsage,
  countAiUses,
  getAiUsageSummary,
  getCachedAiResult,
  saveCachedAiResult,
} from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

async function newUser() {
  const id = randomUUID();
  await createUser({ id, email: `ai-${id}@example.com`, passwordHash: "x", name: "AI User" });
  return id;
}

describe("AI usage records", () => {
  it("counts a user's uses this month, not counting reused answers", async () => {
    const userId = await newUser();
    const since = new Date(Date.now() - 60_000);
    await recordAiUsage({ userId, feature: "cover_letter", model: "m", inputTokens: 500, outputTokens: 300 });
    await recordAiUsage({ userId, feature: "cover_letter", model: "m", reused: true });
    await recordAiUsage({ userId, feature: "agent", model: "m" });
    expect(await countAiUses(userId, "cover_letter", since)).toBe(1);
    expect(await countAiUses(userId, "agent", since)).toBe(1);
    expect(await countAiUses(userId, "cover_letter", new Date(Date.now() + 60_000))).toBe(0);
  });

  it("keeps anonymous totals after the account is deleted", async () => {
    const userId = await newUser();
    const since = new Date(Date.now() - 60_000);
    const feature = `test-${randomUUID().slice(0, 8)}`;
    await recordAiUsage({ userId, feature, model: "m", inputTokens: 100, cacheReadTokens: 900, outputTokens: 10 });
    await deleteUserAccount(userId);
    const row = (await getAiUsageSummary(since)).find((r) => r.feature === feature);
    expect(row).toMatchObject({ calls: 1, input_tokens: 100, cache_read_tokens: 900, output_tokens: 10 });
  });
});

describe("saved AI results", () => {
  it("returns a saved result only to the same user, and deletes it with the account", async () => {
    const userId = await newUser();
    const other = await newUser();
    const key = `cover_letter:${randomUUID()}`;
    expect(await getCachedAiResult(key, userId)).toBeNull();
    await saveCachedAiResult(key, userId, "cover_letter", "Dear team,");
    expect(await getCachedAiResult<string>(key, userId)).toBe("Dear team,");
    expect(await getCachedAiResult(key, other)).toBeNull();
    await saveCachedAiResult(key, userId, "cover_letter", "Version two");
    expect(await getCachedAiResult<string>(key, userId)).toBe("Version two");
    await deleteUserAccount(userId);
    const left = await pool.query("SELECT 1 FROM ai_result_cache WHERE key = $1", [key]);
    expect(left.rowCount).toBe(0);
  });

  it("ignores results older than 30 days", async () => {
    const userId = await newUser();
    const key = `import:${randomUUID()}`;
    await saveCachedAiResult(key, userId, "import", { ok: true });
    await pool.query("UPDATE ai_result_cache SET created_at = now() - interval '31 days' WHERE key = $1", [key]);
    expect(await getCachedAiResult(key, userId)).toBeNull();
  });
});
