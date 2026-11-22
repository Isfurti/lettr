import { describe, it, expect } from "vitest";
import sitemap from "@/app/sitemap";
import { GUIDES } from "@/lib/guides";
import { breadcrumbJsonLd, faqPageJsonLd, jsonLdString } from "@/lib/json-ld";

describe("sitemap dates", () => {
  const entries = sitemap();

  it("does not claim every page changed today", () => {
    const home = entries.find((e) => e.url.endsWith("/") && !e.url.replace(/^https?:\/\/[^/]+/, "").slice(1));
    expect(home?.lastModified).toBeUndefined();
  });

  it("uses each guide's real date", () => {
    for (const g of GUIDES) {
      const entry = entries.find((e) => e.url.endsWith(`/guides/${g.slug}`));
      expect(new Date(entry!.lastModified as Date).toISOString().slice(0, 10)).toBe(g.updated ?? g.published);
    }
  });
});

describe("json-ld helpers", () => {
  it("escapes < so text cannot close the script tag", () => {
    expect(jsonLdString({ a: "</script><b>" })).not.toContain("</script>");
  });

  it("numbers breadcrumbs from 1 with full URLs", () => {
    const b = breadcrumbJsonLd("https://x.test", [
      { name: "Home", path: "/" },
      { name: "Examples", path: "/examples" },
    ]);
    expect(b.itemListElement.map((i) => i.position)).toEqual([1, 2]);
    expect(b.itemListElement[1].item).toBe("https://x.test/examples");
  });

  it("builds a FAQPage with one question per item", () => {
    const f = faqPageJsonLd([{ q: "Q?", a: "A." }]);
    expect(f.mainEntity).toHaveLength(1);
    expect(f.mainEntity[0].acceptedAnswer.text).toBe("A.");
  });
});
