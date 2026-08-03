import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getUserById, incrementPdfDownloadCount, logActivity } from "@/lib/db";
import { canDownloadPdf, canUseTemplate, type Plan } from "@/lib/limits";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import type { ResumeData } from "@/lib/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const check = canDownloadPdf(plan, user?.pdf_download_count ?? 0);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 402 });
  }

  const body = await req.json().catch(() => null);
  const resume = body?.resume as ResumeData | undefined;
  const template = typeof body?.template === "string" ? body.template : "classic";
  if (!resume) return NextResponse.json({ error: "Missing resume data" }, { status: 400 });

  // Template comes raw from the request here, not re-derived from what's
  // saved in the DB - so this needs its own check, not just create/save.
  const templateCheck = canUseTemplate(plan, template);
  if (!templateCheck.allowed) {
    return NextResponse.json({ error: templateCheck.reason, upgradeRequired: true }, { status: 402 });
  }

  const buffer = await renderToBuffer(ResumePdfDocument({ resume, template }));
  await incrementPdfDownloadCount(userId);
  await logActivity(userId, "pdf_exported", resume.contact.fullName || "resume");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${(resume.contact.fullName || "resume").replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
