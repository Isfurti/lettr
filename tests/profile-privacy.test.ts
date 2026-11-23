import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { isPrivatePath } from "@/lib/analytics";
import { scrubDeep, scrubProfileUrls } from "@/lib/sentry-scrub";

describe("tracking is off on private paths", () => {
  it("covers admin and shared profiles only", () => {
    for (const p of ["/admin", "/admin/users", "/p", "/p/abc", "/p/abc/photo", "/dashboard/profile", "/dashboard/profile/preview"]) expect(isPrivatePath(p)).toBe(true);
    for (const p of ["/", "/pricing", "/pro", "/privacy", "/examples/p/x", "/dashboard", "/dashboard/profiles-x"]) expect(isPrivatePath(p)).toBe(false);
  });
});

describe("Sentry never keeps a profile link", () => {
  it("replaces the link part in strings and nested events", () => {
    expect(scrubProfileUrls("https://getlettr.com/p/AbC_123-xyz0123456789?x=1#h")).toBe("https://getlettr.com/p/[link]?x=1#h");
    const ev = { request: { url: "https://x.com/p/SECRETSLUG1234567890" }, breadcrumbs: [{ data: { from: "/p/SECRETSLUG1234567890", to: "/signup" } }], tags: { n: 1 } };
    const out = JSON.stringify(scrubDeep(ev));
    expect(out).not.toContain("SECRETSLUG");
    expect(out).toContain("/signup");
  });
  it("leaves other paths alone", () => {
    expect(scrubProfileUrls("/pricing /privacy /api/profile")).toBe("/pricing /privacy /api/profile");
  });
});

describe("nothing in the app links into /p/ with the router", () => {
  const roots = ["app", "components"];
  const bad = /(<Link[^>]*href=\{?["'`]\/p\/|router\.(push|replace)\(["'`]\/p\/)/;
  function walk(dir: string, out: string[] = []) {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) walk(full, out);
      else if (/\.(tsx|ts)$/.test(f)) out.push(full);
    }
    return out;
  }
  it("uses plain links or no link at all, so tracking scripts are never running when a profile opens", () => {
    const offenders = roots.flatMap((r) => walk(r)).filter((f) => bad.test(readFileSync(f, "utf8")));
    expect(offenders).toEqual([]);
  });
});
