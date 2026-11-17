import { describe, it, expect, afterAll, vi } from "vitest";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { MIGRATIONS } from "@/lib/migrations";

// Uses its own throwaway database, so it can't disturb the other test files
// that share the main test database while they run.
const adminUrl = process.env.DATABASE_URL!;
const dbName = `adopt_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
const url = new URL(adminUrl);
url.pathname = `/${dbName}`;

const BASELINE_CHECKSUM = "c3eb524f3ae2d11f6ba13f9c83f2fac35299a414f4a729f53f40836bf03b1145";

async function withAdmin<T>(fn: (c: pg.Client) => Promise<T>): Promise<T> {
  const c = new pg.Client({ connectionString: adminUrl });
  await c.connect();
  try {
    return await fn(c);
  } finally {
    await c.end();
  }
}

afterAll(async () => {
  await withAdmin((c) => c.query(`DROP DATABASE IF EXISTS ${dbName} WITH (FORCE)`));
});

async function freshDb() {
  await withAdmin((c) => c.query(`CREATE DATABASE ${dbName}`));
  process.env.DATABASE_URL = url.toString();
  vi.resetModules();
  return await import("@/lib/db");
}

describe("adopting the baseline", () => {
  it("builds a fresh database, then a database set up by the old code", async () => {
    const db = await freshDb();
    await db.applySchema(); // fresh database: baseline runs
    let r = await db.default.query("SELECT id FROM schema_migrations");
    expect(r.rows.map((x) => x.id)).toEqual(MIGRATIONS.map((m) => m.id)); // baseline first, then every later migration
    const cols = (await db.default.query("SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='country_code'")).rowCount;
    expect(cols).toBe(1);

    // Now look like the old setup: no schema_migrations, schema_version holds the baseline hash.
    await db.default.query("DROP TABLE schema_migrations");
    await db.default.query("CREATE TABLE IF NOT EXISTS schema_version (id INTEGER PRIMARY KEY, version TEXT NOT NULL)");
    await db.default.query("INSERT INTO schema_version (id, version) VALUES (1, $1)", [BASELINE_CHECKSUM]);
    // A column the baseline would put back if it ran again.
    await db.default.query("ALTER TABLE users DROP COLUMN country_code");
    await db.applySchema();
    r = await db.default.query("SELECT id FROM schema_migrations");
    expect(r.rows.map((x) => x.id)).toEqual(MIGRATIONS.map((m) => m.id)); // baseline first, then every later migration
    const after = (await db.default.query("SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='country_code'")).rowCount;
    expect(after).toBe(0); // recorded, not re-run

    // An old database whose stored hash differs still gets the (safe to repeat) baseline.
    await db.default.query("DROP TABLE schema_migrations");
    await db.default.query("UPDATE schema_version SET version = 'old-hash'");
    await db.applySchema();
    const back = (await db.default.query("SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='country_code'")).rowCount;
    expect(back).toBe(1); // baseline ran and restored it
    await db.default.end();
  });
});
