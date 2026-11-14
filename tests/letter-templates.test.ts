import { describe, it, expect } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { CoverLetterPdf } from "@/components/CoverLetterPdf";
import { generateLetterDocx } from "@/lib/generate-letter-docx";
import {
  canUseLetterTemplate,
  initials,
  isLetterTemplateId,
  LETTER_TEMPLATES,
  letterDate,
  letterFileName,
  letterHeadline,
  letterParagraphs,
  letterRecipient,
  letterRequest,
} from "@/lib/letter-templates";
import type { ResumeData } from "@/lib/types";

const resume: ResumeData = {
  contact: { fullName: "Asha Rao", email: "asha@example.com", phone: "+44 7700 900123", location: "London, UK" },
  summary: "",
  experience: [
    { id: "1", company: "Old Co", role: "Marketing Assistant", startDate: "2018", endDate: "2020", bullets: [] },
    { id: "2", company: "Brightline", role: "Marketing Executive", startDate: "2021", endDate: "Present", bullets: [] },
  ],
  education: [],
  skills: [],
  customization: { market: "UK" },
};
const letter = "Dear Hiring Team,\n\nI'm applying for the role.\n\nKind regards,\nAsha Rao";

describe("letter designs", () => {
  it("has ten designs, two free like resume templates", () => {
    expect(LETTER_TEMPLATES).toHaveLength(10);
    expect(LETTER_TEMPLATES.filter((t) => t.free).map((t) => t.id)).toEqual(["classic", "modern"]);
    expect(canUseLetterTemplate("free", "modern").allowed).toBe(true);
    expect(canUseLetterTemplate("free", "bold").allowed).toBe(false);
    expect(canUseLetterTemplate("pro", "bold").allowed).toBe(true);
    expect(isLetterTemplateId("nope")).toBe(false);
  });

  it("splits paragraphs and keeps the sign-off together", () => {
    expect(letterParagraphs(letter)).toEqual(["Dear Hiring Team,", "I'm applying for the role.", "Kind regards,\nAsha Rao"]);
  });

  it("writes the date the market's way and picks the current job", () => {
    const d = new Date("2026-11-14T12:00:00Z");
    expect(letterDate("US", d)).toBe("November 14, 2026");
    expect(letterDate("UK", d)).toBe("14 November 2026");
    expect(letterHeadline(resume)).toBe("Marketing Executive");
    expect(initials("Asha Rao")).toBe("AR");
    expect(letterFileName(resume, "pdf")).toBe("Asha_Rao_Cover_Letter.pdf");
  });

  it("addresses resignation letters to the manager and names the file", () => {
    expect(letterRecipient("resignation", "Brightline", "Anita Rao")).toBe("Anita Rao\nBrightline");
    expect(letterRecipient("resignation", "Brightline", "")).toBe("Brightline");
    expect(letterRecipient("cover", "Sunrise", "")).toBe("Hiring Team\nSunrise");
    expect(letterFileName(resume, "docx", "resignation", "Asha R Rao")).toBe("Asha_R_Rao_Resignation_Letter.docx");
    expect(letterRequest({ kind: "resignation", letter: "x" }).kind).toBe("resignation");
    expect(letterRequest({ kind: "weird" }).kind).toBe("cover");
  });

  it("renders a resignation letter in a Pro design", async () => {
    const pdf = await renderToBuffer(
      CoverLetterPdf({ resume, letter, design: "executive", company: "Brightline", kind: "resignation", manager: "Anita Rao", name: "Asha Rao", headline: "Marketing Executive" }),
    );
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    const docx = await generateLetterDocx({ resume, letter, design: "executive", company: "Brightline", kind: "resignation", manager: "Anita Rao" });
    expect(docx.subarray(0, 2).toString()).toBe("PK");
  });

  it("renders every design as a PDF and a Word file", async () => {
    for (const t of LETTER_TEMPLATES) {
      const pdf = await renderToBuffer(CoverLetterPdf({ resume, letter, design: t.id, company: "Sunrise Retail" }));
      expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
      const docx = await generateLetterDocx({ resume, letter, design: t.id, company: "Sunrise Retail" });
      expect(docx.subarray(0, 2).toString()).toBe("PK");
    }
  }, 60000);
});
