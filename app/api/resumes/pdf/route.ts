import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getUserById, incrementPdfDownloadCount, logActivity } from "@/lib/db";
import { canUseTemplate, pdfNeedsFooter } from "@/lib/limits";
import { cleanPdfsUsed, recordUse, usageContext } from "@/lib/free-usage";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import type { ResumeData } from "@/lib/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await getUserById(userId);
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });
  // PDFs never stop on the free plan: after the clean ones they carry a small "Made with Lettr" line.
  const footer = pdfNeedsFooter(ctx.tier, await cleanPdfsUsed(ctx, user?.pdf_download_count ?? 0));

  const body = await req.json().catch(() => null);
  const resume = body?.resume as ResumeData | undefined;
  const template = typeof body?.template === "string" ? body.template : "classic";
  if (!resume) return NextResponse.json({ error: "Missing resume data" }, { status: 400 });

  // Template comes raw from the request here, not re-derived from what's
  // saved in the DB - so this needs its own check, not just create/save.
  const templateCheck = canUseTemplate(ctx.tier, template);
  if (!templateCheck.allowed) {
    return NextResponse.json({ error: templateCheck.reason, upgradeRequired: true }, { status: 402 });
  }

  const buffer = await renderToBuffer(ResumePdfDocument({ resume, template, footer }));
  await incrementPdfDownloadCount(userId);
  if (!footer) await recordUse(ctx, "pdf_clean");
  await logActivity(userId, "pdf_exported", resume.contact.fullName || "resume");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "X-Lettr-Footer": footer ? "1" : "0",
      "Content-Disposition": `attachment; filename="${(resume.contact.fullName || "resume").replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
