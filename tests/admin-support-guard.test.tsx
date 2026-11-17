import { beforeEach, describe, expect, it, vi } from "vitest";

let email: string | null = null;
vi.mock("@/lib/auth", () => ({ auth: async () => (email ? { user: { id: "u1", email } } : null) }));
const update = vi.fn();
vi.mock("@/lib/db", () => ({ listSupportMessages: async () => [], updateSupportMessageStatus: (...a: unknown[]) => update(...a) }));

beforeEach(() => {
  process.env.ADMIN_EMAIL = "boss@example.com";
  update.mockReset();
});

describe("support inbox page", () => {
  it("shows a signed-in non-admin nothing about ADMIN_EMAIL (404 instead)", async () => {
    email = "someone@example.com";
    const { default: Page } = await import("@/app/admin/support/page");
    await expect(Page()).rejects.toThrow(/NEXT_HTTP_ERROR_FALLBACK|NEXT_NOT_FOUND/);
  });
  it("sends signed-out visitors to login", async () => {
    email = null;
    const { default: Page } = await import("@/app/admin/support/page");
    await expect(Page()).rejects.toThrow(/NEXT_REDIRECT/);
  });
  it("lets the admin in", async () => {
    email = "Boss@Example.com ";
    const { default: Page } = await import("@/app/admin/support/page");
    await expect(Page()).resolves.toBeTruthy();
  });
});

describe("support resolve route", () => {
  const call = async () => {
    const { POST } = await import("@/app/api/support/resolve/route");
    return POST(new Request("https://x.test/api/support/resolve", { method: "POST", body: JSON.stringify({ id: "m1", status: "resolved" }) }));
  };
  it("refuses non-admins and signed-out callers", async () => {
    email = "someone@example.com";
    expect((await call()).status).toBe(401);
    email = null;
    expect((await call()).status).toBe(401);
    expect(update).not.toHaveBeenCalled();
  });
  it("lets the admin resolve a message", async () => {
    email = "boss@example.com";
    expect((await call()).status).toBe(200);
    expect(update).toHaveBeenCalledWith("m1", "resolved");
  });
});
