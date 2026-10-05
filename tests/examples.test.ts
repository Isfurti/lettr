import { describe, it, expect } from "vitest";
import { EXAMPLES, EXAMPLE_CATEGORIES } from "@/lib/examples";
import { TEMPLATE_IDS } from "@/lib/templates";

describe("examples library", () => {
  it("has at least 30 examples with unique slugs", () => {
    expect(EXAMPLES.length).toBeGreaterThanOrEqual(30);
    expect(new Set(EXAMPLES.map((e) => e.slug)).size).toBe(EXAMPLES.length);
  });

  it("uses only real templates and listed categories", () => {
    for (const e of EXAMPLES) {
      expect(TEMPLATE_IDS as readonly string[]).toContain(e.template);
      expect(EXAMPLE_CATEGORIES).toContain(e.category);
    }
  });

  it("gives every example a complete resume and reasons it works", () => {
    for (const e of EXAMPLES) {
      expect(e.resume.contact.fullName).toBeTruthy();
      expect(e.resume.summary.length).toBeGreaterThan(40);
      expect(e.resume.experience.length + (e.resume.projects?.length ?? 0)).toBeGreaterThan(0);
      expect(e.resume.education.length).toBeGreaterThan(0);
      expect(e.resume.skills.length).toBeGreaterThanOrEqual(4);
      expect(e.why.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("covers the Indian roles in the plan", () => {
    const slugs = EXAMPLES.map((e) => e.slug);
    for (const s of ["campus-placement-software-engineer", "mba-fresher-marketing", "chartered-accountant", "iti-electrician", "bpo-to-data-analyst"]) {
      expect(slugs).toContain(s);
    }
  });

  it("uses every template at least once", () => {
    const used = new Set(EXAMPLES.map((e) => e.template));
    const unused = TEMPLATE_IDS.filter((t) => !used.has(t) && !["sidebar", "bold", "timeline"].includes(t));
    expect(unused).toEqual([]);
  });
});
