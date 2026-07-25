import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, logActivity } from "@/lib/db";
import { canExportDocx, type Plan } from "@/lib/limits";
import { generateResumeDocx } from "@/lib/generate-docx";
import type { ResumeData } from "@/lib/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const check = canExportDocx(plan);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 402 });
  }

  const body = await req.json().catch(() => null);
  const resume = body?.resume as ResumeData | undefined;
  if (!resume) return NextResponse.json({ error: "Missing resume data" }, { status: 400 });

  const buffer = await generateResumeDocx(resume);
  await logActivity(userId, "docx_exported", resume.contact.fullName || "resume");

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${(resume.contact.fullName || "resume").replace(/\s+/g, "_")}.docx"`,
    },
  });
}
