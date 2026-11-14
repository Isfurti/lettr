import { AlignmentType, BorderStyle, Document, Packer, PageOrientation, Paragraph, ShadingType, TextRun } from "docx";
import type { ResumeData } from "./types";
import { contactParts } from "./contact";
import { resolveAccent } from "./customization";
import { pageSize } from "./layout";
import { marketOf } from "./market";
import { letterDate, letterHeadline, letterParagraphs, letterRecipient, type LetterKind, type LetterTemplateId } from "./letter-templates";

const INK = "041632";
const MUTED = "4A5568";

/** Word fonts that match each design's PDF look closely enough on any computer. */
const WORD_FONTS: Record<LetterTemplateId, { display: string; body: string }> = {
  classic: { display: "Times New Roman", body: "Calibri" },
  modern: { display: "Calibri", body: "Calibri" },
  minimal: { display: "Calibri Light", body: "Calibri Light" },
  bold: { display: "Calibri", body: "Calibri" },
  elegant: { display: "Georgia", body: "Calibri" },
  executive: { display: "Times New Roman", body: "Calibri" },
  sidebar: { display: "Calibri", body: "Calibri" },
  editorial: { display: "Georgia", body: "Calibri" },
  monogram: { display: "Georgia", body: "Calibri" },
  corporate: { display: "Calibri", body: "Calibri" },
};

/**
 * The cover letter as an editable Word file. Word can't reproduce every
 * design exactly, so it keeps each design's fonts, colour and heading style.
 */
export async function generateLetterDocx(params: {
  resume: ResumeData;
  letter: string;
  design: LetterTemplateId;
  company?: string;
  kind?: LetterKind;
  manager?: string;
  name?: string;
  headline?: string;
  now?: Date;
}): Promise<Buffer> {
  const { resume, letter, design, company, kind = "cover", manager } = params;
  const accent = resolveAccent(resume.customization?.accentColor).replace("#", "");
  const fonts = WORD_FONTS[design];
  const name = params.name?.trim() || resume.contact.fullName?.trim() || "Your Name";
  const headline = params.headline?.trim() || letterHeadline(resume);
  const contact = contactParts(resume.contact).join("  ·  ");
  const centred = design === "classic" || design === "elegant";
  const banded = design === "bold" || design === "sidebar";
  const nameColor = banded ? "FFFFFF" : design === "modern" || design === "corporate" ? accent : INK;
  const align = centred ? AlignmentType.CENTER : AlignmentType.LEFT;
  const band = banded ? { type: ShadingType.CLEAR, color: "auto", fill: accent } : undefined;

  const children: Paragraph[] = [
    new Paragraph({
      alignment: align,
      shading: band,
      children: [
        new TextRun({
          text: design === "minimal" ? name.toUpperCase() : name,
          bold: design !== "minimal" && design !== "elegant",
          size: design === "minimal" ? 26 : 48,
          color: nameColor,
          font: fonts.display,
        }),
      ],
    }),
  ];
  if (headline && design !== "minimal") {
    children.push(
      new Paragraph({
        alignment: align,
        shading: band,
        children: [new TextRun({ text: headline, size: 21, color: banded ? "FFFFFF" : MUTED, font: fonts.body })],
      }),
    );
  }
  if (contact) {
    children.push(
      new Paragraph({
        alignment: align,
        shading: band,
        spacing: { after: 120 },
        border:
          design === "bold" || design === "sidebar" || design === "minimal"
            ? undefined
            : { bottom: { style: BorderStyle.SINGLE, size: design === "executive" ? 18 : 6, color: design === "executive" || design === "classic" ? INK : accent, space: 8 } },
        children: [new TextRun({ text: contact, size: 18, color: banded ? "FFFFFF" : MUTED, font: fonts.body })],
      }),
    );
  }
  children.push(
    new Paragraph({
      spacing: { before: 360, after: 240 },
      alignment: design === "corporate" ? AlignmentType.RIGHT : AlignmentType.LEFT,
      children: [new TextRun({ text: letterDate(marketOf(resume.customization), params.now), size: 20, color: MUTED, font: fonts.body })],
    }),
  );
  const recipient = letterRecipient(kind, company, manager).split("\n").filter(Boolean);
  recipient.forEach((line, i) =>
    children.push(
      new Paragraph({
        spacing: { after: i === recipient.length - 1 ? 240 : 0 },
        children: [new TextRun({ text: line, size: 21, font: fonts.body, color: INK })],
      }),
    ),
  );
  for (const para of letterParagraphs(letter)) {
    const lines = para.split("\n");
    children.push(
      new Paragraph({
        spacing: { after: 200, line: 300 },
        children: lines.map((line, i) => new TextRun({ text: line, size: 21, font: fonts.body, color: INK, break: i > 0 ? 1 : undefined })),
      }),
    );
  }

  const letterSize = pageSize(resume.customization) === "LETTER";
  const doc = new Document({
    creator: name,
    title: `${name} – ${kind === "resignation" ? "Resignation letter" : "Cover letter"}`,
    sections: [
      {
        properties: {
          page: {
            size: { width: letterSize ? 12240 : 11906, height: letterSize ? 15840 : 16838, orientation: PageOrientation.PORTRAIT },
            margin: { top: 1080, bottom: 1080, left: 1200, right: 1200 },
          },
        },
        children,
      },
    ],
    styles: { default: { document: { run: { font: fonts.body } } } },
  });
  return Packer.toBuffer(doc);
}
