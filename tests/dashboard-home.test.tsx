import { describe, it, expect, afterAll, beforeEach, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createUser, deleteUserAccount, upsertResume } from "@/lib/db";
import pool from "@/lib/db";
import { emptyResume } from "@/lib/types";

const session: { user?: { id: string; email: string; name: string } } = {};
vi.mock("@/lib/auth", () => ({ auth: async () => (session.user ? { user: session.user } : null) }));

const made: string[] = [];
beforeEach(() => { session.user = undefined; });
afterAll(async () => {
  for (const id of made) await deleteUserAccount(id).catch(() => {});
  await pool.end();
});

async function signedInUser(withResume: boolean) {
  const id = randomUUID();
  made.push(id);
  await createUser({ id, email: `home-${id}@example.com`, passwordHash: "x" });
  if (withResume) await upsertResume({ id: randomUUID(), userId: id, title: "R", template: "classic", data: JSON.stringify({ ...emptyResume, contact: { fullName: "Home Person" } }) });
  session.user = { id, email: `home-${id}@example.com`, name: "Home Person" };
}

const redirectTarget = async (p: Promise<unknown>) => {
  try { await p; } catch (e) { return String((e as { digest?: string }).digest ?? e); }
  return "";
};

describe("/dashboard home", () => {
  it("sends signed-out visitors to log in", async () => {
    const Home = (await import("@/app/dashboard/page")).default;
    expect(await redirectTarget(Home({ searchParams: Promise.resolve({}) }))).toContain("/login");
  });

  it("forwards old dashboard links (import, draft, upgraded, drive) to the resume list with their parameters", async () => {
    await signedInUser(true);
    const Home = (await import("@/app/dashboard/page")).default;
    for (const q of [{ import: "1" }, { draft: "save" }, { upgraded: "1" }, { drive_connected: "true" }, { drive_error: "x" }]) {
      const to = await redirectTarget(Home({ searchParams: Promise.resolve(q) }));
      const [k, v] = Object.entries(q)[0];
      expect(to).toContain(`/dashboard/resumes?${k}=${v}`);
    }
  });

  it("renders the profile for a user with a resume and for one with none, without throwing", async () => {
    const Home = (await import("@/app/dashboard/page")).default;
    await signedInUser(true);
    expect(await Home({ searchParams: Promise.resolve({ source: "app" }) })).toBeTruthy();
    await signedInUser(false);
    expect(await Home({ searchParams: Promise.resolve({}) })).toBeTruthy();
  });
});
