import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { anonymousClientKey } from "@/lib/client-key";
import { fitToOnePage, measurePages } from "@/lib/pdf-fit";
import { TEMPLATE_IDS } from "@/lib/templates";
import type { ResumeData } from "@/lib/types";

export const runtime = "nodejs";

/**
 * "Fit to one page" in the Design panel: renders the PDF at a few sizes and
 * returns the largest spacing that fits on one page. With `measure: true` it
 * only counts the pages (for the ATS page-length check). Nothing is saved or
 * counted as a download. Works for guests too (rate-limited).
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const key = userId ?? anonymousClientKey(req.headers);
  const body = await req.json().catch(() => null);
  const measureOnly = body?.measure === true;
  const limit = measureOnly
    ? await checkAndRecordRateLimit(key, "resume-pages", userId ? 120 : 40, 10)
    : await checkAndRecordRateLimit(key, "resume-fit", userId ? 30 : 15, 10);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: `Please wait ${limit.retryAfterSeconds}s and try again.` },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  const resume = body?.resume as ResumeData | undefined;
  const template = typeof body?.template === "string" && (TEMPLATE_IDS as readonly string[]).includes(body.template) ? body.template : "classic";
  if (!resume || typeof resume !== "object" || !resume.contact || !Array.isArray(resume.experience)) {
    return NextResponse.json({ error: "Missing resume data" }, { status: 400 });
  }
  if (JSON.stringify(resume).length > 3_000_000) {
    return NextResponse.json({ error: "Resume is too large" }, { status: 413 });
  }

  try {
    if (measureOnly) return NextResponse.json({ pages: await measurePages(resume, template) });
    return NextResponse.json(await fitToOnePage(resume, template));
  } catch {
    return NextResponse.json({ error: "Couldn't measure the pages. Try again." }, { status: 500 });
  }
}
