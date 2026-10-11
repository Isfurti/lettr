import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { extractTextFromFile } from "@/lib/extract-text";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import { SAMPLE_RESUME } from "@/lib/sample-resume";

describe("reading uploaded resumes", () => {
  it("reads the text out of a PDF (the free checker and import depend on it)", async () => {
    const pdf = await renderToBuffer(ResumePdfDocument({ resume: SAMPLE_RESUME, template: "classic" }));
    const text = await extractTextFromFile(Buffer.from(pdf), "Priya_Sharma.pdf");
    expect(text).toContain("Priya Sharma");
    expect(text).toContain("Freshworks");
  }, 30_000);

  it("explains a broken PDF in plain words instead of a library error", async () => {
    await expect(extractTextFromFile(Buffer.from("%PDF-1.4 this is not really a pdf"), "broken.pdf")).rejects.toThrow(
      /couldn't read that PDF/
    );
  }, 30_000);

  it("reads plain text and rejects other file types", async () => {
    expect(await extractTextFromFile(Buffer.from("Priya Sharma\nProduct marketer"), "cv.txt")).toContain("Priya");
    await expect(extractTextFromFile(Buffer.from("x"), "photo.png")).rejects.toThrow(/Unsupported file type/);
  });
});
