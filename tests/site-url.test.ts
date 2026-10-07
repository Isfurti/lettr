import { describe, expect, it } from "vitest";
import { siteUrl } from "@/lib/site-url";

describe("siteUrl", () => {
  it("prefers NEXTAUTH_URL and drops a trailing slash", () => {
    expect(siteUrl({ NEXTAUTH_URL: "https://lettr.in/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe("https://lettr.in");
  });
  it("falls back to the Vercel production domain", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "lettr-three.vercel.app" })).toBe("https://lettr-three.vercel.app");
  });
  it("uses localhost when nothing is set", () => {
    expect(siteUrl({})).toBe("http://localhost:3000");
  });
});
