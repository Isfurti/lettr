import { describe, it, expect } from "vitest";
import { GUIDES, getGuide } from "@/lib/guides";
import { getExample } from "@/lib/examples";

describe("guides", () => {
  it("has unique slugs and complete content", () => {
    const slugs = GUIDES.map((g) => g.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const g of GUIDES) {
      expect(g.title.length).toBeGreaterThan(10);
      expect(g.description.length).toBeGreaterThan(60);
      expect(g.description.length).toBeLessThanOrEqual(200);
      expect(g.sections.length).toBeGreaterThan(2);
      for (const s of g.sections) expect((s.paragraphs?.length ?? 0) + (s.list?.length ?? 0)).toBeGreaterThan(0);
      for (const e of g.relatedExamples ?? []) expect(getExample(e), `${g.slug} -> ${e}`).toBeTruthy();
    }
  });
  it("includes the SEO guides", () => {
    for (const s of ["ats-resume-example", "ats-resume-checklist", "fresher-resume-examples", "bcom-llb-resume-example"]) {
      expect(getGuide(s)).toBeTruthy();
    }
  });
  it("never shows pricing in a guide", () => {
    for (const g of GUIDES) expect(JSON.stringify(g)).not.toMatch(/₹|\$\d|\bprice\b|per month/i);
  });
});
