import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";

import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("checkAndRecordRateLimit", () => {
  it("allows requests under the limit", async () => {
    const userId = randomUUID();
    const result = await checkAndRecordRateLimit(userId, "test-endpoint", 5, 10);
    expect(result.allowed).toBe(true);
  });

  it("allows exactly maxRequests, then blocks the next one", async () => {
    const userId = randomUUID();
    const endpoint = "test-endpoint-2";

    for (let i = 0; i < 3; i++) {
      const result = await checkAndRecordRateLimit(userId, endpoint, 3, 10);
      expect(result.allowed).toBe(true);
    }

    const blocked = await checkAndRecordRateLimit(userId, endpoint, 3, 10);
    expect(blocked.allowed).toBe(false);
    if (!blocked.allowed) {
      expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
    }
  });

  it("tracks limits independently per endpoint for the same user", async () => {
    const userId = randomUUID();

    for (let i = 0; i < 2; i++) {
      await checkAndRecordRateLimit(userId, "endpoint-a", 2, 10);
    }
    const blockedA = await checkAndRecordRateLimit(userId, "endpoint-a", 2, 10);
    expect(blockedA.allowed).toBe(false);

    // Different endpoint, same user - should still be allowed
    const allowedB = await checkAndRecordRateLimit(userId, "endpoint-b", 2, 10);
    expect(allowedB.allowed).toBe(true);
  });

  it("tracks limits independently per user for the same endpoint", async () => {
    const userA = randomUUID();
    const userB = randomUUID();
    const endpoint = "shared-endpoint";

    await checkAndRecordRateLimit(userA, endpoint, 1, 10);
    const blockedA = await checkAndRecordRateLimit(userA, endpoint, 1, 10);
    expect(blockedA.allowed).toBe(false);

    const allowedB = await checkAndRecordRateLimit(userB, endpoint, 1, 10);
    expect(allowedB.allowed).toBe(true);
  });

  it("does not record a blocked attempt (blocking doesn't compound)", async () => {
    const userId = randomUUID();
    const endpoint = "no-compound-endpoint";

    await checkAndRecordRateLimit(userId, endpoint, 1, 10);
    // Try 5 more times while blocked
    for (let i = 0; i < 5; i++) {
      await checkAndRecordRateLimit(userId, endpoint, 1, 10);
    }

    const countRes = await pool.query(
      "SELECT COUNT(*)::int AS count FROM rate_limit_events WHERE user_id = $1 AND endpoint = $2",
      [userId, endpoint]
    );
    expect(countRes.rows[0].count).toBe(1); // only the one successful call was recorded
  });

  it("allows a request again after the time window passes", async () => {
    const userId = randomUUID();
    const endpoint = "window-expiry-endpoint";

    // Manually insert an event just outside a 0-minute-ish window by using
    // a very short window and a real short sleep, proving expiry works
    // without waiting a full 10 minutes in the test.
    await checkAndRecordRateLimit(userId, endpoint, 1, 1 / 60000); // ~1ms window
    await new Promise((r) => setTimeout(r, 50));

    const result = await checkAndRecordRateLimit(userId, endpoint, 1, 1 / 60000);
    expect(result.allowed).toBe(true);
  });
});
