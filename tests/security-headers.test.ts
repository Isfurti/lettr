import { describe, expect, it } from "vitest";
import nextConfig from "../next.config";

describe("security headers", () => {
  it("every page gets the baseline headers, including the safe CSP directives", async () => {
    const rules = await (nextConfig as { headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]> }).headers();
    const all = rules.find((r) => r.source === "/:path*")!.headers;
    const get = (k: string) => all.find((h) => h.key === k)?.value;
    expect(get("Content-Security-Policy")).toContain("frame-ancestors 'self'");
    expect(get("Content-Security-Policy")).toContain("base-uri 'self'");
    expect(get("Content-Security-Policy")).not.toContain("object-src"); // the letter preview is a PDF in an iframe
    expect(get("X-Frame-Options")).toBe("SAMEORIGIN");
    expect(get("Strict-Transport-Security")).toMatch(/max-age=\d+/);
    expect(get("X-Content-Type-Options")).toBe("nosniff");
  });
});
