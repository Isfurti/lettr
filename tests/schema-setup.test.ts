import { describe, it, expect, afterAll } from "vitest";
import pool, { applySchema, changedMigrations } from "@/lib/db";
import { MIGRATIONS, checksum } from "@/lib/migrations";

afterAll(async () => {
  await pool.end();
});

// The baseline is the schema as it was on the live database. Its checksum is
// also the hash the old setup stored, which is how the live database adopts
// it without re-running it. If this fails you edited an applied migration:
// add a new migration instead.
const BASELINE_CHECKSUM = "c3eb524f3ae2d11f6ba13f9c83f2fac35299a414f4a729f53f40836bf03b1145";

describe("migrations list", () => {
  it("has unique, ordered ids", () => {
    const ids = MIGRATIONS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect([...ids].sort()).toEqual(ids);
    for (const id of ids) expect(id).toMatch(/^\d{4}_[a-z0-9_]+$/);
  });

  it("never changes the baseline", () => {
    expect(checksum(MIGRATIONS[0].sql)).toBe(BASELINE_CHECKSUM);
  });
});

describe("database setup", () => {
  it("handles several servers starting at once without errors", async () => {
    await expect(Promise.all([applySchema(), applySchema(), applySchema(), applySchema()])).resolves.toBeDefined();
  });

  it("records every migration with its checksum, once", async () => {
    await applySchema();
    const { rows } = await pool.query("SELECT id, checksum FROM schema_migrations ORDER BY id");
    expect(rows.map((r) => r.id)).toEqual(MIGRATIONS.map((m) => m.id));
    for (const r of rows) expect(r.checksum).toBe(checksum(MIGRATIONS.find((m) => m.id === r.id)!.sql));
    expect(changedMigrations(rows)).toEqual([]);
  });

  it("flags an applied migration whose SQL was edited", () => {
    expect(changedMigrations([{ id: "0001_baseline", checksum: "something-else" }])).toEqual(["0001_baseline"]);
  });

  it("leaves no connection stuck in a transaction", async () => {
    await applySchema();
    const { rows } = await pool.query(
      "SELECT count(*)::int AS n FROM pg_stat_activity WHERE datname = current_database() AND state = 'idle in transaction'"
    );
    expect(rows[0].n).toBe(0);
  });
});
