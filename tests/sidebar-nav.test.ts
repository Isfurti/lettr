import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";

const src = readFileSync("components/AppSidebar.tsx", "utf8");

describe("sidebar after the profile became home", () => {
  it("lists My profile first at /dashboard and the resume list at /dashboard/resumes", () => {
    expect(src.indexOf('href: "/dashboard", label: "My profile"')).toBeGreaterThan(-1);
    expect(src.indexOf('href: "/dashboard/resumes", label: "My resumes"')).toBeGreaterThan(src.indexOf('label: "My profile"'));
    expect(src).not.toContain('label: "Dashboard"');
  });
  it("keeps My profile lit on its settings and preview pages", () => {
    expect(src).toContain('pathname.startsWith("/dashboard/profile/")');
  });
});

describe("no stale links to the old dashboard", () => {
  it("emails, the Drive callback and checkout go to the resume list", () => {
    for (const f of ["lib/email.ts", "app/api/google/callback/route.ts", "components/ProCheckoutButton.tsx"]) {
      const s = readFileSync(f, "utf8");
      expect(s, f).not.toMatch(/\/dashboard(\?|\\n|`|")/);
    }
  });
});
