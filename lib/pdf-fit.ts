import { renderToBuffer } from "@react-pdf/renderer";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import { MAX_SCALE, MIN_SCALE } from "./layout";
import type { ResumeData } from "./types";

/** Number of pages in a PDF made by react-pdf (counts its page objects). */
export function countPdfPages(pdf: Buffer | Uint8Array): number {
  const text = Buffer.from(pdf).toString("latin1");
  return (text.match(/\/Type\s*\/Page(?![s\w])/g) ?? []).length;
}

async function pagesAt(resume: ResumeData, template: string, scale: number): Promise<number> {
  const r = { ...resume, customization: { ...resume.customization, scale } };
  return countPdfPages(await renderToBuffer(ResumePdfDocument({ resume: r, template })));
}

export type FitResult = {
  /** Pages at the resume's current spacing. */
  pages: number;
  /** Largest spacing (up to normal size) that fits one page, or null if even the smallest doesn't. */
  scale: number | null;
};

/**
 * "Fit to one page": finds the largest text-and-spacing scale, up to the
 * template's normal size, at which the PDF is a single page. A few renders
 * at most (binary search in steps of 0.01).
 */
export async function fitToOnePage(resume: ResumeData, template: string): Promise<FitResult> {
  const current = Math.min(MAX_SCALE, Math.max(MIN_SCALE, resume.customization?.scale ?? 1));
  const pages = await pagesAt(resume, template, current);
  if ((await pagesAt(resume, template, 1)) === 1) return { pages, scale: 1 };
  if ((await pagesAt(resume, template, MIN_SCALE)) > 1) return { pages, scale: null };
  let lo = Math.round(MIN_SCALE * 100); // fits
  let hi = 100; // doesn't fit
  while (hi - lo > 1) {
    const mid = Math.floor((lo + hi) / 2);
    if ((await pagesAt(resume, template, mid / 100)) === 1) lo = mid;
    else hi = mid;
  }
  return { pages, scale: lo / 100 };
}
