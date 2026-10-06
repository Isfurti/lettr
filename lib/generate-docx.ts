import { Document, Packer, Paragraph, TextRun, HeadingLevel, BorderStyle, PageOrientation } from "docx";
import { extraSections, type ResumeData } from "./types";
import { DEFAULT_ACCENT_COLOR } from "./customization";
import { applyLayout, layoutScale, pageSize, sectionOrder, type SectionKey } from "./layout";
import { parseRich } from "./rich-text";

/** Word runs for text that may contain <b>, <i> or <u>. */
function richRuns(text: string, size: number): TextRun[] {
  return parseRich(text).map(
    (seg) => new TextRun({ text: seg.text, size, bold: seg.b || undefined, italics: seg.i || undefined, underline: seg.u ? {} : undefined })
  );
}

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

export async function generateResumeDocx(input: ResumeData): Promise<Buffer> {
  const resume = applyLayout(input);
  const c = input.customization;
  const seal = (resume.customization?.accentColor || DEFAULT_ACCENT_COLOR).replace("#", "");
  // Word sizes are half-points; Spacing / "Fit to one page" scale them too.
  const k = layoutScale(c);
  const sz = (n: number) => Math.round(n * k);

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

  const blocks: Record<SectionKey, Paragraph[]> = {
    summary: [], experience: [], education: [], skills: [], projects: [], certifications: [], achievements: [], languages: [],
  };
  let section: SectionKey = "summary";
  const add = (p: Paragraph) => blocks[section].push(p);

  if (resume.summary) {
    add(sectionHeading("Summary", seal));
    add(new Paragraph({ spacing: { after: 100 }, children: richRuns(resume.summary, sz(20)) }));
  }

  section = "experience";
  if (resume.experience.length > 0) {
    add(sectionHeading("Experience", seal));
    for (const exp of resume.experience) {
      add(
        new Paragraph({
          spacing: { before: 120 },
          tabStops: [{ type: "right", position: 9000 }],
          children: [
            new TextRun({ text: `${exp.role} — ${exp.company}`, bold: true, size: sz(20) }),
            new TextRun({ text: `\t${exp.startDate} – ${exp.endDate}`, size: sz(18), color: MUTED }),
          ],
        })
      );
      for (const bullet of exp.bullets.filter(Boolean)) {
        add(
          new Paragraph({
            bullet: { level: 0 },
            spacing: { after: 40 },
            children: richRuns(bullet, sz(20)),
          })
        );
      }
    }
  }

  section = "education";
  if (resume.education.length > 0) {
    add(sectionHeading("Education", seal));
    for (const edu of resume.education) {
      add(
        new Paragraph({
          spacing: { after: 60 },
          tabStops: [{ type: "right", position: 9000 }],
          children: [
            new TextRun({ text: `${edu.degree} — ${edu.school}`, bold: true, size: sz(20) }),
            new TextRun({ text: `\t${edu.startDate} – ${edu.endDate}`, size: sz(18), color: MUTED }),
          ],
        })
      );
    }
  }

  section = "skills";
  if (resume.skills.length > 0) {
    add(sectionHeading("Skills", seal));
    add(new Paragraph({ children: [new TextRun({ text: resume.skills.join("  •  "), size: sz(20) })] }));
  }

  const extra = extraSections(resume);
  section = "projects";
  if (extra.projects.length > 0) {
    add(sectionHeading("Projects", seal));
    for (const p of extra.projects) {
      add(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({ text: p.name, bold: true, size: sz(20) }),
            ...(p.link ? [new TextRun({ text: `  ·  ${p.link}`, size: sz(18), color: MUTED })] : []),
          ],
        })
      );
      if (p.description) {
        add(new Paragraph({ spacing: { after: 60 }, children: richRuns(p.description, sz(20)) }));
      }
    }
  }
  section = "certifications";
  if (extra.certifications.length > 0) {
    add(sectionHeading("Certifications", seal));
    for (const c of extra.certifications) {
      add(
        new Paragraph({
          spacing: { after: 40 },
          children: [
            new TextRun({ text: c.name, bold: true, size: sz(20) }),
            new TextRun({ text: [c.issuer, c.date].filter(Boolean).join(", ") ? ` — ${[c.issuer, c.date].filter(Boolean).join(", ")}` : "", size: sz(20), color: MUTED }),
          ],
        })
      );
    }
  }
  section = "achievements";
  if (extra.achievements.length > 0) {
    add(sectionHeading("Achievements", seal));
    for (const a of extra.achievements) {
      add(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: richRuns(a, sz(20)) }));
    }
  }
  section = "languages";
  if (extra.languages.length > 0) {
    add(sectionHeading("Languages", seal));
    add(new Paragraph({ children: [new TextRun({ text: extra.languages.join("  •  "), size: sz(20) })] }));
  }

  for (const key of sectionOrder(c)) children.push(...blocks[key]);

  // A4: 11906 x 16838 twips; US Letter: 12240 x 15840.
  const letter = pageSize(c) === "LETTER";
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { width: letter ? 12240 : 11906, height: letter ? 15840 : 16838, orientation: PageOrientation.PORTRAIT },
          },
        },
        children,
      },
    ],
    styles: {
      default: { document: { run: { font: "Calibri" } } },
    },
  });

  return Packer.toBuffer(doc);
}
