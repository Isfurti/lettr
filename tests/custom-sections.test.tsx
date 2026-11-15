import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import { ResumePreview } from "@/components/ResumeEditor";
import { generateResumeDocx } from "@/lib/generate-docx";
import { applyLayout, sectionOrder } from "@/lib/layout";
import { scoreResumeAgainstJob } from "@/lib/ats-score";
import { buildCoverLetterPrompt, normalizeExtractedResume } from "@/lib/ai";
import { plainResume } from "@/lib/rich-text";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import { TEMPLATE_IDS } from "@/lib/templates";
import { customItemDates, customSections, customSectionText, emptyResume, type ResumeData } from "@/lib/types";

const full: ResumeData = {
  ...SAMPLE_RESUME,
  customSections: [
    {
      id: "s1",
      heading: "Research experience",
      items: [
        {
          id: "i1",
          title: "Research Assistant",
          subtitle: "IIT Delhi",
          startDate: "Jan 2022",
          endDate: "Mar 2023",
          bullets: ["Studied crop yields with spectroscopy", ""],
        },
        { id: "i2", title: "Lab Volunteer", bullets: [] },
      ],
    },
    { id: "s2", heading: "Volunteering", items: [{ id: "i3", title: "Teach For India", bullets: ["Taught maths to 30 students"] }] },
    // Left out: no heading, or nothing in it.
    { id: "s3", heading: "", items: [{ id: "i4", title: "Orphan", bullets: [] }] },
    { id: "s4", heading: "Empty one", items: [{ id: "i5", title: "", bullets: [] }] },
  ],
};

describe("custom section helpers", () => {
  it("old resumes without the field have no custom sections", () => {
    expect(customSections(emptyResume)).toEqual([]);
    expect(customSections(SAMPLE_RESUME)).toEqual([]);
    expect(customSectionText(emptyResume)).toEqual([]);
  });

  it("keeps only sections with a heading and a filled item, and drops blank bullets", () => {
    const list = customSections(full);
    expect(list.map((s) => s.heading)).toEqual(["Research experience", "Volunteering"]);
    expect(list[0].items[0].bullets).toEqual(["Studied crop yields with spectroscopy"]);
  });

  it("formats item dates", () => {
    expect(customItemDates({ startDate: "Jan 2022", endDate: "Mar 2023" })).toBe("Jan 2022 – Mar 2023");
    expect(customItemDates({ startDate: "", endDate: "2023" })).toBe("2023");
    expect(customItemDates({})).toBe("");
  });

  it("follows the date style, hiding and section order", () => {
    const long = applyLayout({ ...full, customization: { dateStyle: "long" } });
    expect(long.customSections?.[0].items[0].startDate).toBe("January 2022");
    const hidden = applyLayout({ ...full, customization: { hiddenSections: ["custom"] } });
    expect(customSections(hidden)).toEqual([]);
    expect(sectionOrder(undefined).at(-1)).toBe("custom");
  });

  it("strips formatting tags for scoring and AI", () => {
    const r = plainResume({ ...full, customSections: [{ id: "s", heading: "H", items: [{ id: "i", title: "T", bullets: ["<b>Bold</b> work"] }] }] });
    expect(r.customSections?.[0].items[0].bullets).toEqual(["Bold work"]);
  });
});

describe("custom sections in every template", () => {
  it.each(TEMPLATE_IDS)("preview %s shows the heading, items, dates and bullets", (template) => {
    const html = renderToStaticMarkup(<ResumePreview data={full} template={template} />);
    expect(html.toLowerCase()).toContain("research experience");
    expect(html).toContain("Research Assistant");
    expect(html).toContain("IIT Delhi");
    expect(html).toContain("Jan 2022 – Mar 2023");
    expect(html).toContain("Studied crop yields with spectroscopy");
    expect(html).toContain("Lab Volunteer");
    expect(html.toLowerCase()).toContain("volunteering");
    expect(html).toContain("Taught maths to 30 students");
    expect(html).not.toContain("Orphan");
    expect(html).not.toContain("Empty one");
  });

  it.each(TEMPLATE_IDS)("preview %s leaves them off when hidden", (template) => {
    const html = renderToStaticMarkup(
      <ResumePreview data={{ ...full, customization: { ...full.customization, hiddenSections: ["custom"] } }} template={template} />
    );
    expect(html).not.toContain("Research Assistant");
  });

  it.each(TEMPLATE_IDS)("PDF %s renders with custom sections", async (template) => {
    const plain = await renderToBuffer(ResumePdfDocument({ resume: SAMPLE_RESUME, template }));
    const pdf = await renderToBuffer(ResumePdfDocument({ resume: full, template }));
    // The extra sections add content to the file.
    expect(pdf.length).toBeGreaterThan(plain.length);
  }, 30_000);

  it("Word file includes them", async () => {
    const plain = await generateResumeDocx(SAMPLE_RESUME);
    const buf = await generateResumeDocx(full);
    expect(buf.length).toBeGreaterThan(plain.length);
  });
});

describe("ATS, AI and import read custom sections", () => {
  it("counts custom section text as resume text", () => {
    const res = scoreResumeAgainstJob(full, "Looking for spectroscopy experience. Spectroscopy is used daily.");
    expect(res.matchedKeywords.map((k) => k.toLowerCase())).toContain("spectroscopy");
    const without = scoreResumeAgainstJob(SAMPLE_RESUME, "Looking for spectroscopy experience. Spectroscopy is used daily.");
    expect(without.matchedKeywords.map((k) => k.toLowerCase())).not.toContain("spectroscopy");
  });

  it("includes them in the cover letter prompt", () => {
    const prompt = buildCoverLetterPrompt({ resume: full, jobDescription: "A job" });
    expect(prompt).toContain("Research experience:");
    expect(prompt).toContain("Research Assistant, IIT Delhi (Jan 2022 – Mar 2023): Studied crop yields with spectroscopy");
  });

  it("imports other sections as custom sections", () => {
    const r = normalizeExtractedResume({
      contact: {},
      customSections: [
        { heading: "Research Experience", items: [{ title: "Research Assistant", subtitle: "IIT Delhi", startDate: "2022", endDate: "2023", bullets: ["Did a study"] }] },
        { heading: "", items: [{ title: "No heading" }] },
        { heading: "No items", items: [] },
        null,
      ],
    });
    expect(r.customSections).toHaveLength(1);
    const s = r.customSections![0];
    expect(s.heading).toBe("Research Experience");
    expect(s.id).toBeTruthy();
    expect(s.items[0]).toMatchObject({ title: "Research Assistant", subtitle: "IIT Delhi", startDate: "2022", endDate: "2023", bullets: ["Did a study"] });
    expect(s.items[0].id).toBeTruthy();
  });

  it("imports a resume with no custom sections without the field", () => {
    expect(normalizeExtractedResume({ contact: {} }).customSections).toBeUndefined();
    expect(normalizeExtractedResume({ contact: {}, customSections: "nope" }).customSections).toBeUndefined();
  });
});
