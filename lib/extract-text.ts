import mammoth from "mammoth";

/** Shown instead of a library error, which means nothing to the person uploading. */
const UNREADABLE_PDF = "We couldn't read that PDF. Try saving it as a PDF again, or upload a Word file instead.";

export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) {
    // pdf-parse/worker must load first. pdfjs needs DOMMatrix, ImageData and
    // Path2D as soon as it loads; plain Node (and Vercel's functions) has none,
    // and pdfjs's own fallback finds @napi-rs/canvas with a runtime require
    // that Vercel's file tracing can't see - so on Vercel every PDF upload
    // failed with "DOMMatrix is not defined". This import sets them up from
    // @napi-rs/canvas (also listed in next.config.ts so it ships) and brings
    // the pdfjs worker with it, so nothing has to be found on disk later.
    const { CanvasFactory, getData } = await import("pdf-parse/worker");
    const { PDFParse } = await import("pdf-parse");
    PDFParse.setWorker(getData());
    const parser = new PDFParse({ data: buffer, CanvasFactory });
    try {
      const result = await parser.getText();
      return result.text;
    } catch (err) {
      console.error("PDF text extraction failed", err);
      throw new Error(UNREADABLE_PDF);
    } finally {
      await parser.destroy();
    }
  }

  if (lower.endsWith(".docx")) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }

  if (lower.endsWith(".txt")) {
    return buffer.toString("utf-8");
  }

  throw new Error("Unsupported file type. Please upload a PDF, DOCX, or TXT file.");
}
