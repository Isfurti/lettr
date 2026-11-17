import { describe, expect, it } from "vitest";
import { cronAuthorized } from "@/lib/cron-auth";

const req = (auth?: string) => new Request("https://x.test/api/cron/billing", { headers: auth ? { authorization: auth } : {} });

describe("cronAuthorized", () => {
  it("accepts only the exact bearer secret", () => {
    expect(cronAuthorized(req("Bearer s3cret"), "s3cret")).toBe(true);
    expect(cronAuthorized(req("Bearer wrong"), "s3cret")).toBe(false);
    expect(cronAuthorized(req("s3cret"), "s3cret")).toBe(false);
    expect(cronAuthorized(req(), "s3cret")).toBe(false);
  });
  it("refuses everyone when no secret is configured", () => {
    for (const secret of [undefined, ""]) {
      expect(cronAuthorized(req(), secret as never)).toBe(false);
      expect(cronAuthorized(req("Bearer "), secret as never)).toBe(false);
      expect(cronAuthorized(req("Bearer undefined"), secret as never)).toBe(false);
    }
  });
});

describe("cron routes", () => {
  it("answer 401 without the secret, even when CRON_SECRET is unset", async () => {
    const saved = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    try {
      const billing = await import("@/app/api/cron/billing/route");
      const reviews = await import("@/app/api/cron/reviews/route");
      expect((await billing.GET(req())).status).toBe(401);
      expect((await reviews.GET(req())).status).toBe(401);
    } finally {
      if (saved !== undefined) process.env.CRON_SECRET = saved;
    }
  });
});
