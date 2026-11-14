import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getUserById, logActivity } from "@/lib/db";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { usageContext } from "@/lib/free-usage";
import { CoverLetterPdf } from "@/components/CoverLetterPdf";
import { canUseLetterTemplate, isLetterTemplateId, letterFileName } from "@/lib/letter-templates";
import type { ResumeData } from "@/lib/types";

/**
 * Cover letter as a PDF in one of ten designs. `inline: true` returns it for
 * the preview instead of as a download. Pro designs are checked here too,
 * since the design comes from the request.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Please sign in to download your cover letter." }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const limit = await checkAndRecordRateLimit(userId, "letter-pdf", 60, 10);
  if (!limit.allowed) return NextResponse.json({ error: "Too many requests. Try again in a few minutes." }, { status: 429 });

  const body = await req.json().catch(() => null);
  const resume = body?.resume as ResumeData | undefined;
  const letter = typeof body?.letter === "string" ? body.letter.slice(0, 8000) : "";
  const design = body?.design;
  const company = typeof body?.company === "string" ? body.company.slice(0, 120) : "";
  const inline = body?.inline === true;
  if (!resume?.contact || !letter.trim()) return NextResponse.json({ error: "Write the cover letter first." }, { status: 400 });
  if (!isLetterTemplateId(design)) return NextResponse.json({ error: "Pick a letter design." }, { status: 400 });

  const user = await getUserById(userId);
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });
  // Previews of Pro designs are allowed so people can see them; downloads aren't.
  const check = canUseLetterTemplate(ctx.tier, design);
  if (!check.allowed && !inline) return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 402 });

  const buffer = await renderToBuffer(CoverLetterPdf({ resume, letter, design, company }));
  if (!inline) await logActivity(userId, "letter_pdf_exported", design);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename="${letterFileName(resume, "pdf")}"`,
      "Cache-Control": "no-store",
    },
  });
}
