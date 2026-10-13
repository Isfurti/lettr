import { describe, it, expect, afterAll, beforeEach, afterEach } from "vitest";
import { POST } from "@/app/api/auth/forgot-password/route";
import pool from "@/lib/db";

afterAll(async () => {
  await pool.end();
});

function request(body: unknown) {
  return new Request("http://localhost/api/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("forgot password without an email service", () => {
  let savedKey: string | undefined;
  beforeEach(() => {
    savedKey = process.env.RESEND_API_KEY;
    delete process.env.RESEND_API_KEY;
  });
  afterEach(() => {
    if (savedKey === undefined) delete process.env.RESEND_API_KEY;
    else process.env.RESEND_API_KEY = savedKey;
  });

  it("says reset emails are off instead of claiming one was sent", async () => {
    const res = await POST(request({ email: "someone@example.com" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, emailEnabled: false });
  });

  it("gives every address the same answer, so it can't be used to find accounts", async () => {
    const a = await (await POST(request({ email: "nobody-here@example.com" }))).json();
    const b = await (await POST(request({ email: "ANOTHER@example.com" }))).json();
    expect(a).toEqual(b);
  });

  it("still rejects something that isn't an email", async () => {
    const res = await POST(request({ email: "not-an-email" }));
    expect(res.status).toBe(400);
  });
});
