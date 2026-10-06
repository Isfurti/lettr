import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import { ResumePreview } from "@/components/ResumeEditor";
import { countPdfPages, fitToOnePage } from "@/lib/pdf-fit";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import { TEMPLATE_IDS } from "@/lib/templates";
import type { ResumeData } from "@/lib/types";

const rich: ResumeData = {
  ...SAMPLE_RESUME,
  summary: "Product marketer with <b>6 years</b> in <i>B2B</i> software and <u>launches</u>.",
  experience: SAMPLE_RESUME.experience.map((e, i) => (i === 0 ? { ...e, bullets: ["<b>Led</b> 4 launches", ...e.bullets] } : e)),
  customization: {
    sectionOrder: ["skills", "education", "experience", "summary"],
    hiddenSections: ["languages"],
    dateStyle: "long",
    pageSize: "LETTER",
    scale: 0.9,
    photoShape: "square",
  },
};

describe("PDF with layout settings", () => {
  it.each(TEMPLATE_IDS)("renders %s with formatting, order, spacing and page size", async (template) => {
    const pdf = await renderToBuffer(ResumePdfDocument({ resume: rich, template }));
    expect(countPdfPages(pdf)).toBeGreaterThanOrEqual(1);
    const text = Buffer.from(pdf).toString("latin1");
    expect(text).toMatch(/MediaBox \[0 0 612 792\]/); // US Letter
    expect(text).not.toContain("&lt;b&gt;");
  }, 30_000);

  it("uses A4 by default", async () => {
    const pdf = await renderToBuffer(ResumePdfDocument({ resume: SAMPLE_RESUME, template: "classic" }));
    expect(Buffer.from(pdf).toString("latin1")).toMatch(/MediaBox \[0 0 595\.\d+ 841\.\d+\]/);
  });
});

describe("preview with layout settings", () => {
  it.each(TEMPLATE_IDS)("%s shows bold/italic/underline, drops hidden sections and reorders", (template) => {
    const html = renderToStaticMarkup(<ResumePreview data={rich} template={template} />);
    expect(html).toContain("<strong");
    expect(html).toContain("<em>B2B</em>");
    expect(html).toContain("<u>launches</u>");
    expect(html).not.toContain("&lt;b&gt;");
  });
  it("puts sections in the chosen order", () => {
    const html = renderToStaticMarkup(<ResumePreview data={rich} template="classic" />);
    expect(html.indexOf(">Skills<")).toBeLessThan(html.indexOf(">Experience<"));
    expect(html.indexOf(">Education<")).toBeLessThan(html.indexOf(">Summary<"));
  });
  it("keeps a template's own order until the user picks one", () => {
    const html = renderToStaticMarkup(<ResumePreview data={SAMPLE_RESUME} template="scholar" />);
    expect(html.indexOf(">Education<")).toBeLessThan(html.indexOf(">Experience<"));
  });
});

describe("fit to one page", () => {
  it("finds a scale that fits a long resume on one page", async () => {
    const long: ResumeData = {
      ...SAMPLE_RESUME,
      experience: Array.from({ length: 4 }, () => SAMPLE_RESUME.experience).flat().map((e, i) => ({ ...e, id: `x${i}` })),
    };
    const r = await fitToOnePage(long, "classic");
    expect(r.pages).toBeGreaterThan(1);
    expect(r.scale).not.toBeNull();
    expect(r.scale!).toBeLessThan(1);
    const pdf = await renderToBuffer(ResumePdfDocument({ resume: { ...long, customization: { scale: r.scale! } }, template: "classic" }));
    expect(countPdfPages(pdf)).toBe(1);
  }, 60_000);
});
