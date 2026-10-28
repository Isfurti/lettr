import { describe, it, expect } from "vitest";
import { consentRequired } from "@/lib/consent-region";
import { GET } from "@/app/api/consent-region/route";

describe("cookie consent by country", () => {
  it("asks first in the EU, EEA, UK and Switzerland, and when the country is unknown", () => {
    for (const c of ["DE", "FR", "NL", "IE", "NO", "GB", "CH", "gb", null, ""]) expect(consentRequired(c)).toBe(true);
  });

  it("is on by default elsewhere", () => {
    for (const c of ["IN", "US", "AE", "AU", "CA", "SG"]) expect(consentRequired(c)).toBe(false);
  });

  it("answers per visitor and is never cached for everyone", async () => {
    const res = await GET(new Request("http://localhost/api/consent-region", { headers: { "x-vercel-ip-country": "IN" } }));
    expect(await res.json()).toEqual({ required: false });
    expect(res.headers.get("cache-control")).toContain("no-store");
    const eu = await GET(new Request("http://localhost/api/consent-region", { headers: { "x-vercel-ip-country": "DE" } }));
    expect(await eu.json()).toEqual({ required: true });
  });
});
