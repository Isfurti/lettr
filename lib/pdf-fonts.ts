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

// Manrope has no italic design, so its italic borrows Inter's (a close
// match) - otherwise text set in italic with the I button would print upright.
const FAMILIES: { family: string; pkg: string; file: string; italic: boolean; italicFrom?: { pkg: string; file: string } }[] = [
  { family: "SourceSerif", pkg: "source-serif-4", file: "source-serif-4", italic: true },
  { family: "Manrope", pkg: "manrope", file: "manrope", italic: false, italicFrom: { pkg: "inter", file: "inter" } },
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
    const italicSrc = (weight: number) =>
      f.italicFrom
        ? path.join(base, f.italicFrom.pkg, "files", `${f.italicFrom.file}-latin-${weight}-italic.woff`)
        : src(weight, f.italic ? "italic" : "normal");
    const fonts = [400, 600, 700].flatMap((weight) => [
      { src: src(weight, "normal"), fontWeight: weight },
      // Families without a true italic reuse the upright file (or a close
      // match's italic), so a template that asks for italic still renders.
      { src: italicSrc(weight), fontWeight: weight, fontStyle: "italic" as const },
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
  for (const f of FAMILIES) giveOwnName(`${f.family}Ext`);
  // Keep words whole instead of hyphenating mid-word. A run of several spaces
  // (the gaps in "a@b.com  •  +91..." or Grid's wide contact gaps) is handed
  // back as single spaces: react-pdf treats a word followed by anything but a
  // single space as a hyphenation point, so a line that wrapped there printed
  // a stray "-" ("rahulverma-test-", "Pipeline management ·-").
  Font.registerHyphenationCallback((word) => (/^ {2,}$/.test(word) ? word.split("") : [word]));
  registered = true;
  return true;
}

/**
 * A font's latin and latin-ext files share one internal name (both are
 * "Manrope-Regular"), and the PDF writer reuses an embedded font that has the
 * same name. So a ₹ from the latin-ext file was drawn with the latin file's
 * glyph at the same position - a tiny "8" instead of ₹ on every resume and
 * GST invoice. Renaming each fallback file as it loads makes the writer embed
 * it on its own, so ₹ (and é, ł, ş...) print correctly.
 */
function giveOwnName(family: string) {
  const fonts = Font as unknown as {
    getRegisteredFonts: () => Record<string, { sources: { fontWeight: number; fontStyle: string; data: unknown; load: () => Promise<void> }[] }>;
  };
  for (const source of fonts.getRegisteredFonts()[family]?.sources ?? []) {
    const load = source.load.bind(source);
    source.load = async () => {
      await load();
      if (source.data && typeof source.data === "object") {
        Object.defineProperty(source.data, "postscriptName", {
          value: `${family}-${source.fontWeight}-${source.fontStyle}`,
          configurable: true,
        });
      }
    };
  }
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

/** Fonts for GST invoices: Manrope with its extended set (for ₹), or Helvetica if the files aren't bundled. */
export function invoicePdfFont(): PdfFontFamily {
  return registerOnce() ? ["Manrope", "ManropeExt"] : "Helvetica";
}
