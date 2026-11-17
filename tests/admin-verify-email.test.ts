import { afterAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import bcrypt from "bcryptjs";
import pool, { createUser, getAuthEpoch, getUserById } from "@/lib/db";

vi.mock("@/lib/admin-auth", () => ({ requireAdminApi: async () => ({ id: "admin-1", email: "boss@example.com" }) }));

afterAll(async () => {
  await pool.end();
});

describe("admin 'verify email'", () => {
  const verify = async (id: string) => {
    const { POST } = await import("@/app/api/admin/users/[id]/verify-email/route");
    return POST(new Request("https://x.test"), { params: Promise.resolve({ id }) });
  };

  it("on an unverified account also cancels its password and open sessions", async () => {
    const id = randomUUID();
    await createUser({ id, email: `av-${id}@example.com`, passwordHash: await bcrypt.hash("set-by-someone", 4) });
    expect((await verify(id)).status).toBe(200);
    const u = (await getUserById(id))!;
    expect(u.email_verified).toBe(true);
    expect(await bcrypt.compare("set-by-someone", u.password_hash)).toBe(false);
    expect(await getAuthEpoch(id)).toBe(1);
  });

  it("leaves an already verified account untouched", async () => {
    const id = randomUUID();
    const hash = await bcrypt.hash("mine", 4);
    await createUser({ id, email: `av2-${id}@example.com`, passwordHash: hash, emailVerified: true });
    await verify(id);
    expect((await getUserById(id))!.password_hash).toBe(hash);
    expect(await getAuthEpoch(id)).toBe(0);
  });
});
