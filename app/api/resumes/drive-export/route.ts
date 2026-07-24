import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { canExportToGoogleDrive, type Plan } from "@/lib/limits";
import { getValidGoogleAccessToken, uploadFileToDrive } from "@/lib/google-drive";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import type { ResumeData } from "@/lib/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const check = canExportToGoogleDrive(plan);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 402 });
  }

  const body = await req.json().catch(() => null);
  const resume = body?.resume as ResumeData | undefined;
  const template = typeof body?.template === "string" ? body.template : "classic";
  if (!resume) return NextResponse.json({ error: "Missing resume data" }, { status: 400 });

  let accessToken: string;
  try {
    accessToken = await getValidGoogleAccessToken(userId);
  } catch {
    return NextResponse.json(
      { error: "Google Drive isn't connected yet.", driveConnectRequired: true },
      { status: 428 }
    );
  }

  try {
    const buffer = await renderToBuffer(ResumePdfDocument({ resume, template }));
    const filename = `${(resume.contact.fullName || "resume").replace(/\s+/g, "_")}.pdf`;
    const uploaded = await uploadFileToDrive({
      accessToken,
      filename,
      mimeType: "application/pdf",
      buffer: Buffer.from(buffer),
    });
    return NextResponse.json({ webViewLink: uploaded.webViewLink });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload to Google Drive";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
