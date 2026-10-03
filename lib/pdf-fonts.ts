import fs from "node:fs";
import path from "node:path";
import { Font } from "@react-pdf/renderer";
import { getFontPair } from "./customization";
import type { ResumeData } from "./types";

/**
 * Registers the same font families the live preview uses, so the PDF a
 * user downloads matches what they picked in "Font pair". Files come from
 * the @fontsource packages already installed for the web UI - see
 * outputFileTracingIncludes in next.config.ts, which ships them with the
 * PDF routes on Vercel.
 */

const FAMILIES: { family: string; pkg: string; file: string; italic: boolean }[] = [
  { family: "SourceSerif", pkg: "source-serif-4", file: "source-serif-4", italic: true },
  { family: "Manrope", pkg: "manrope", file: "manrope", italic: false },
  { family: "Playfair", pkg: "playfair-display", file: "playfair-display", italic: true },
  { family: "Inter", pkg: "inter", file: "inter", italic: true },
];

let registered: boolean | null = null; // null = not tried yet

/** Returns false if the font files aren't available (e.g. not bundled), so callers fall back to built-ins. */
function registerOnce(): boolean {
  if (registered !== null) return registered;
  const base = path.join(process.cwd(), "node_modules", "@fontsource");
  const allPresent = FAMILIES.every((f) =>
    fs.existsSync(path.join(base, f.pkg, "files", `${f.file}-latin-700-normal.woff`))
  );
  if (!allPresent) {
    registered = false;
    return false;
  }
  for (const f of FAMILIES) {
    const src = (weight: number, style: "normal" | "italic") =>
      path.join(base, f.pkg, "files", `${f.file}-latin-${weight}-${style}.woff`);
    const fonts = [400, 600, 700].flatMap((weight) => [
      { src: src(weight, "normal"), fontWeight: weight },
      // Families without a true italic reuse the upright file, so a template
      // that asks for italic still renders instead of throwing.
      { src: src(weight, f.italic ? "italic" : "normal"), fontWeight: weight, fontStyle: "italic" as const },
    ]);
    Font.register({ family: f.family, fonts });
    // latin-ext carries ₹ and accented names (é, ł, ş...) that the base latin
    // subset lacks - registered as a fallback family used after the main one.
    Font.register({
      family: `${f.family}Ext`,
      fonts: [400, 700].flatMap((weight) => [
        { src: path.join(base, f.pkg, "files", `${f.file}-latin-ext-${weight}-normal.woff`), fontWeight: weight },
        {
          src: path.join(base, f.pkg, "files", `${f.file}-latin-ext-${weight}-${f.italic ? "italic" : "normal"}.woff`),
          fontWeight: weight,
          fontStyle: "italic" as const,
        },
      ]),
    });
  }
  // Keep words whole instead of hyphenating mid-word.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
  return true;
}

type PdfFontFamily = string | string[];

const PAIRS: Record<string, { display: PdfFontFamily; body: PdfFontFamily }> = {
  editorial: { display: ["SourceSerif", "SourceSerifExt"], body: ["Manrope", "ManropeExt"] },
  elegant: { display: ["Playfair", "PlayfairExt"], body: ["Inter", "InterExt"] },
  // Built-in PDF fonts, with Manrope's extended set as a fallback for ₹ etc.
  classic: { display: ["Times-Roman", "ManropeExt"], body: ["Helvetica", "ManropeExt"] },
};

const BUILT_IN_ONLY = { display: "Times-Roman", body: "Helvetica" };

/** The PDF font families for this resume's chosen font pair. */
export function pdfFonts(resume: ResumeData): { display: PdfFontFamily; body: PdfFontFamily } {
  const pair = getFontPair(resume.customization?.fontChoice);
  // Never fail a download over fonts - if the files aren't available, use the built-ins.
  if (!registerOnce()) return BUILT_IN_ONLY;
  return PAIRS[pair.id] ?? PAIRS.classic;
}
