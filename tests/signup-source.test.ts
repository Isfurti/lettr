import { describe, it, expect, afterAll } from "vitest";
import { randomUUID } from "node:crypto";
import pool, { createUser, getUserById, countSignupsBySource } from "@/lib/db";
import { findOrCreateOAuthUser } from "@/lib/oauth-user";
import {
  classifyTouch,
  deriveChannel,
  parseSourceCookie,
  serializeSourceCookie,
  type SignupSource,
} from "@/lib/signup-source";

afterAll(async () => {
  await pool.end();
});

const now = new Date("2026-11-25T10:00:00Z");
const touch = (href: string, referrer = "") =>
  classifyTouch({ href, referrer, ownHosts: ["getlettr.com", "localhost"], now });

describe("classifyTouch", () => {
  it("calls a gclid visit Google Ads and keeps no click ID", () => {
    const t = touch("https://getlettr.com/?gclid=ABC123&utm_campaign=Lettr+Search");
    expect(t.channel).toBe("google_ads");
    expect(t.paid_click).toBe(true);
    expect(JSON.stringify(t)).not.toContain("ABC123");
  });
  it("calls a Google search referrer organic search", () => {
    expect(touch("https://getlettr.com/guides/x", "https://www.google.com/").channel).toBe("organic_search");
  });
  it("does not treat a bare fbclid as paid", () => {
    const t = touch("https://getlettr.com/?fbclid=zzz", "https://l.facebook.com/");
    expect(t.channel).toBe("social");
    expect(t.paid_click).toBe(false);
  });
  it("treats Meta with a paid medium as Meta ads", () => {
    expect(touch("https://getlettr.com/?utm_source=facebook&utm_medium=cpc&fbclid=1").channel).toBe("meta_ads");
  });
  it("ignores its own site as a referrer", () => {
    const t = touch("https://getlettr.com/pricing", "https://getlettr.com/");
    expect(t.channel).toBe("direct");
    expect(t.referrer_host).toBeNull();
  });
  it("drops query strings from the landing path and survives a broken URL", () => {
    expect(touch("https://getlettr.com/a/b?x=1#h").landing_path).toBe("/a/b");
    expect(touch("not a url").channel).toBe("direct");
  });
});

describe("parseSourceCookie", () => {
  const good = (o: Partial<SignupSource> = {}) =>
    JSON.stringify({ referrer_host: "google.com", landing_path: "/", first_seen: "2026-11-20", paid_click: false, ...o });

  it("round-trips what the browser writes (after Next's single decode)", () => {
    const t = touch("https://getlettr.com/?gclid=1&utm_campaign=100%25+off", "");
    const cookie = decodeURIComponent(serializeSourceCookie(t));
    expect(JSON.parse(cookie)).not.toHaveProperty("channel");
    const back = parseSourceCookie(cookie, now);
    expect(back?.channel).toBe("google_ads");
  });
  it("ignores a channel written into the cookie", () => {
    const back = parseSourceCookie(good({ channel: "google_ads" } as never), now);
    expect(back?.channel).toBe("organic_search");
  });
  it("rejects garbage, arrays, oversize and empty objects", () => {
    expect(parseSourceCookie("%%%", now)).toBeNull();
    expect(parseSourceCookie("[1]", now)).toBeNull();
    expect(parseSourceCookie("{}", now)).toBeNull();
    expect(parseSourceCookie(JSON.stringify({ utm_source: "a".repeat(700) }), now)).toBeNull();
    expect(parseSourceCookie(null, now)).toBeNull();
  });
  it("drops bad fields, future dates, old dates and non-true paid_click", () => {
    const b = parseSourceCookie(
      good({ landing_path: "javascript:x", first_seen: "2030-01-01", paid_click: "true" as never, referrer_host: "bad host!", utm_source: "reddit" }),
      now
    );
    expect(b?.landing_path).toBeNull();
    expect(b?.first_seen).toBeNull();
    expect(b?.paid_click).toBe(false);
    expect(b?.referrer_host).toBeNull();
    expect(parseSourceCookie(good({ first_seen: "2026-09-01" }), now)?.first_seen).toBeNull();
  });
  it("derives the same channel as the browser does", () => {
    expect(deriveChannel({ referrer_host: null, utm_source: "newsletter", utm_medium: null, paid_click: false })).toBe("email");
  });
});

describe("storing the source", () => {
  const src = parseSourceCookie(JSON.stringify({ referrer_host: "reddit.com", landing_path: "/", first_seen: "2026-11-25" }))!;

  it("saves it with createUser and leaves it null when absent", async () => {
    const a = randomUUID();
    const b = randomUUID();
    await createUser({ id: a, email: `src-${a}@example.com`, passwordHash: "x", signupSource: src });
    await createUser({ id: b, email: `src-${b}@example.com`, passwordHash: "x" });
    expect((await getUserById(a))?.signup_source?.channel).toBe("social");
    expect((await getUserById(b))?.signup_source).toBeNull();
  });

  it("saves it for a new OAuth account", async () => {
    const email = `src-oauth-${randomUUID()}@example.com`;
    const u = await findOrCreateOAuthUser(email, "O", src);
    expect((await getUserById(u.id))?.signup_source?.referrer_host).toBe("reddit.com");
  });

  it("counts by channel, with older accounts as not_recorded, and leaves out the excluded email", async () => {
    const adminEmail = `src-admin-${randomUUID()}@example.com`;
    await createUser({ id: randomUUID(), email: adminEmail, passwordHash: "x", signupSource: src });
    const before = await countSignupsBySource(30, adminEmail);
    const social = before.find((r) => r.channel === "social")?.count ?? 0;
    const withAdmin = await countSignupsBySource(30);
    expect((withAdmin.find((r) => r.channel === "social")?.count ?? 0) - social).toBe(1);
    expect(before.some((r) => r.channel === "not_recorded")).toBe(true);
  });
});
