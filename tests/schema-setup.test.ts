import { describe, it, expect, afterAll } from "vitest";
import pool, { applySchema } from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("database setup", () => {
  it("handles several servers starting at once without errors", async () => {
    await expect(Promise.all([applySchema(), applySchema(), applySchema(), applySchema()])).resolves.toBeDefined();
  });

  it("records which version of the setup ran, so later starts can skip it", async () => {
    await applySchema();
    const { rows } = await pool.query("SELECT version FROM schema_version");
    expect(rows).toHaveLength(1);
    expect(rows[0].version).toMatch(/^[0-9a-f]{64}$/);
  });

  it("leaves no connection stuck in a transaction", async () => {
    await applySchema();
    const { rows } = await pool.query(
      "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction'"
    );
    expect(rows[0].n).toBe(0);
  });
});
