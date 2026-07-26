import mammoth from "mammoth";

export async function extractTextFromFile(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase();

  if (lower.endsWith(".pdf")) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
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
