import { describe, it, expect, afterEach, vi } from "vitest";
import { sendPasswordResetEmail, sendVerificationEmail } from "@/lib/email";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

/** Sends through a fake Resend and returns the email text that would go out. */
async function capture(send: () => Promise<unknown>): Promise<string> {
  const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
  await send();
  const init = (fetchMock.mock.calls[0] as unknown[])[1] as { body: string };
  return JSON.parse(init.body).text as string;
}

describe("links in emails", () => {
  it("point at the live site on Vercel even when NEXTAUTH_URL isn't set", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("NEXTAUTH_URL", "");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "lettr-three.vercel.app");

    const reset = await capture(() => sendPasswordResetEmail("a@example.com", "abc"));
    expect(reset).toContain("https://lettr-three.vercel.app/reset-password?token=abc");
    expect(reset).not.toContain("localhost");

    const verify = await capture(() => sendVerificationEmail("a@example.com", "xyz"));
    expect(verify).toContain("https://lettr-three.vercel.app/verify-email?token=xyz");
  });

  it("use NEXTAUTH_URL when it is set, e.g. a custom domain", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("NEXTAUTH_URL", "https://lettr.in/");
    vi.stubEnv("VERCEL_PROJECT_PRODUCTION_URL", "lettr-three.vercel.app");

    const reset = await capture(() => sendPasswordResetEmail("a@example.com", "abc"));
    expect(reset).toContain("https://lettr.in/reset-password?token=abc");
  });

  it("send replies to the support inbox", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    const fetchMock = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendPasswordResetEmail("a@example.com", "abc");
    const init = (fetchMock.mock.calls[0] as unknown[])[1] as { body: string };
    expect(JSON.parse(init.body).reply_to).toBe("support@noonscope.com");
  });
});
