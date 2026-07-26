import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle } from "docx";
import type { ResumeData } from "./types";
import { DEFAULT_ACCENT_COLOR } from "./customization";

const INK = "1B2A4A";
const MUTED = "5B6472";

function contactLine(resume: ResumeData): string {
  return [resume.contact.email, resume.contact.phone, resume.contact.location, resume.contact.linkedin, resume.contact.website]
    .filter(Boolean)
    .join("   •   ");
}

function sectionHeading(text: string, seal: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 100 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: INK } },
    children: [new TextRun({ text: text.toUpperCase(), color: seal, bold: true, size: 20 })],
  });
}

export async function generateResumeDocx(resume: ResumeData): Promise<Buffer> {
  const seal = (resume.customization?.accentColor || DEFAULT_ACCENT_COLOR).replace("#", "");

  const children: Paragraph[] = [
    new Paragraph({
      spacing: { after: 40 },
      children: [new TextRun({ text: resume.contact.fullName || "Your Name", bold: true, size: 36, color: INK })],
    }),
    new Paragraph({
      spacing: { after: 200 },
      children: [new TextRun({ text: contactLine(resume), size: 18, color: MUTED })],
    }),
  ];

  if (resume.summary) {
    children.push(sectionHeading("Summary", seal));
    children.push(new Paragraph({ spacing: { after: 100 }, children: [new TextRun({ text: resume.summary, size: 20 })] }));
  }

  if (resume.experience.length > 0) {
    children.push(sectionHeading("Experience", seal));
    for (const exp of resume.experience) {
      children.push(
        new Paragraph({
          spacing: { before: 120 },
          tabStops: [{ type: "right", position: 9000 }],
          children: [
            new TextRun({ text: `${exp.role} — ${exp.company}`, bold: true, size: 20 }),
            new TextRun({ text: `\t${exp.startDate} – ${exp.endDate}`, size: 18, color: MUTED }),
          ],
        })
      );
      for (const bullet of exp.bullets.filter(Boolean)) {
        children.push(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: [new TextRun({ text: bullet, size: 20 })],
          })
        );
      }
    }
  }

  if (resume.education.length > 0) {
    children.push(sectionHeading("Education", seal));
    for (const edu of resume.education) {
      children.push(
        new Paragraph({
          spacing: { after: 60 },
          tabStops: [{ type: "right", position: 9000 }],
          children: [
            new TextRun({ text: `${edu.degree} — ${edu.school}`, bold: true, size: 20 }),
            new TextRun({ text: `\t${edu.startDate} – ${edu.endDate}`, size: 18, color: MUTED }),
          ],
        })
      );
    }
  }

  if (resume.skills.length > 0) {
    children.push(sectionHeading("Skills", seal));
    children.push(new Paragraph({ children: [new TextRun({ text: resume.skills.join("  •  "), size: 20 })] }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
    styles: {
      default: { document: { run: { font: "Calibri" } } },
    },
  });

  return Packer.toBuffer(doc);
}
