import { describe, it, expect, afterAll } from "vitest";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

describe("database pool", () => {
  it("survives a connection being cut while idle instead of crashing the server", () => {
    expect(pool.listenerCount("error")).toBeGreaterThan(0);
    expect(() => pool.emit("error", new Error("terminating connection due to administrator command"))).not.toThrow();
  });
});
