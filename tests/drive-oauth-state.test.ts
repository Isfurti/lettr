import { beforeEach, describe, expect, it, vi } from "vitest";
import { newOAuthState, oauthStateMatches, DRIVE_STATE_COOKIE } from "@/lib/oauth-state";

const connect = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: async () => ({ user: { id: "user-1" } }) }));
vi.mock("@/lib/google-drive", () => ({
  connectGoogleDriveForUser: (...a: unknown[]) => connect(...a),
  buildGoogleAuthUrl: (state: string) => `https://accounts.google.com/o/oauth2/v2/auth?state=${state}`,
}));

beforeEach(() => connect.mockReset());

describe("oauth state helpers", () => {
  it("makes a different long value each time and matches only itself", () => {
    const a = newOAuthState();
    expect(a).toHaveLength(48);
    expect(newOAuthState()).not.toBe(a);
    expect(oauthStateMatches(a, a)).toBe(true);
    expect(oauthStateMatches(a, newOAuthState())).toBe(false);
    expect(oauthStateMatches(undefined, a)).toBe(false);
    expect(oauthStateMatches(a, null)).toBe(false);
    expect(oauthStateMatches("", "")).toBe(false);
  });
});

describe("Drive connect and callback", () => {
  it("connect sets an httpOnly state cookie and sends the same value to Google", async () => {
    const { GET } = await import("@/app/api/google/connect/route");
    const res = await GET();
    const location = res.headers.get("location")!;
    const state = new URL(location).searchParams.get("state")!;
    const cookie = res.headers.get("set-cookie")!;
    expect(cookie).toContain(`${DRIVE_STATE_COOKIE}=${state}`);
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
    expect(state).not.toBe("user-1");
  });

  const call = async (state: string | null, cookie?: string) => {
    const { GET } = await import("@/app/api/google/callback/route");
    const q = new URLSearchParams({ code: "abc", ...(state ? { state } : {}) });
    return GET(new Request(`https://lettr.test/api/google/callback?${q}`, { headers: cookie ? { cookie } : {} }));
  };

  it("callback connects only when the cookie and state match", async () => {
    const ok = await call("s".repeat(48), `${DRIVE_STATE_COOKIE}=${"s".repeat(48)}`);
    expect(ok.headers.get("location")).toContain("drive_connected=true");
    expect(connect).toHaveBeenCalledWith("user-1", "abc");
  });

  it("callback rejects the old scheme (user id as state), a missing cookie, and a mismatch", async () => {
    for (const [state, cookie] of [["user-1", undefined], ["x".repeat(48), undefined], ["a".repeat(48), `${DRIVE_STATE_COOKIE}=${"b".repeat(48)}`], [null, `${DRIVE_STATE_COOKIE}=abc`]] as const) {
      const res = await call(state, cookie);
      expect(res.headers.get("location")).toContain("invalid_callback");
    }
    expect(connect).not.toHaveBeenCalled();
  });
});
