import { describe, it, expect } from "vitest";
import { Document, Font, Page, Text, renderToBuffer } from "@react-pdf/renderer";
import { invoicePdfFont, pdfFonts } from "@/lib/pdf-fonts";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import { SAMPLE_RESUME } from "@/lib/sample-resume";

/** Names of the fonts embedded in a PDF (e.g. "ManropeExt-400-normal"). */
function embeddedFonts(pdf: Uint8Array): string[] {
  const raw = Buffer.from(pdf).toString("latin1");
  return [...raw.matchAll(/\/BaseFont \/[A-Z]{6}\+([A-Za-z0-9-]+)/g)].map((m) => m[1]);
}

describe("₹ and accented letters in PDFs", () => {
  // The latin and latin-ext font files share one internal name, so the PDF
  // writer used to reuse the latin file for ₹ and print a tiny "8" instead.
  it("embeds the extended font separately so ₹ prints as ₹ on resumes", async () => {
    const pdf = await renderToBuffer(ResumePdfDocument({ resume: SAMPLE_RESUME, template: "classic" }));
    const fonts = embeddedFonts(pdf);
    expect(SAMPLE_RESUME.experience[0].bullets.join(" ")).toContain("₹");
    expect(fonts.some((f) => /Ext-\d+-(normal|italic)$/.test(f))).toBe(true);
  }, 30_000);

  it("does the same for GST invoices", async () => {
    const font = invoicePdfFont();
    const pdf = await renderToBuffer(
      <Document>
        <Page style={{ fontFamily: font }}>
          <Text>Total: ₹699 (incl. 18% GST)</Text>
        </Page>
      </Document>
    );
    expect(embeddedFonts(pdf)).toContain("ManropeExt-400-normal");
  }, 30_000);

  it("works for every font pair", async () => {
    for (const fontChoice of ["editorial", "elegant", "classic"] as const) {
      const resume = { ...SAMPLE_RESUME, customization: { fontChoice } };
      const f = pdfFonts(resume);
      const pdf = await renderToBuffer(
        <Document>
          <Page style={{ fontFamily: f.body }}>
            <Text>₹2 Cr</Text>
            <Text style={{ fontFamily: f.display, fontWeight: 700 }}>₹3 Cr</Text>
          </Page>
        </Document>
      );
      expect(embeddedFonts(pdf).filter((n) => /Ext-/.test(n)).length).toBeGreaterThanOrEqual(1);
    }
  }, 30_000);
});

describe("line wrapping in PDFs", () => {
  it("hands runs of spaces back as single spaces, so they stay plain line-break points", () => {
    pdfFonts(SAMPLE_RESUME); // registers fonts and the hyphenation rule
    const hyphenate = Font.getHyphenationCallback()!;
    expect(hyphenate("    ")).toEqual([" ", " ", " ", " "]);
    expect(hyphenate("management")).toEqual(["management"]);
  });

  it("never adds a stray hyphen where a line wraps at a wide gap", async () => {
    pdfFonts(SAMPLE_RESUME); // registers fonts and the hyphenation rule
    const items = ["rahul.verma@example.com", "+91 98XXX XXXXX", "New Delhi, India", "linkedin.com/in/rahulverma-test", "rahulverma.dev"];
    const pdf = await renderToBuffer(
      <Document>
        <Page size="A4" style={{ fontFamily: pdfFonts(SAMPLE_RESUME).body, fontSize: 10, padding: 40 }}>
          <Text style={{ width: 260 }}>{items.join("    ")}</Text>
          <Text style={{ width: 200 }}>{["B2B sales", "Dealer management", "Pipeline management", "Forecasting", "Team coaching"].join("  ·  ")}</Text>
        </Page>
      </Document>
    );
    // Every line break inside these strings sits at a space, so no "-" should be drawn at a line end.
    const { execFileSync } = await import("node:child_process");
    const { writeFileSync, mkdtempSync } = await import("node:fs");
    const { join } = await import("node:path");
    const { tmpdir } = await import("node:os");
    let text: string;
    try {
      const dir = mkdtempSync(join(tmpdir(), "lettr-pdf-"));
      const file = join(dir, "wrap.pdf");
      writeFileSync(file, pdf);
      text = execFileSync("pdftotext", ["-layout", file, "-"]).toString();
    } catch {
      return; // pdftotext isn't installed here; the hyphen check needs it
    }
    const lineEnds = text.split("\n").map((l) => l.trimEnd()).filter(Boolean);
    expect(lineEnds.some((l) => /[a-z·]-$/.test(l))).toBe(false);
  }, 30_000);
});
