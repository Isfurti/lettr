import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getUserById, logActivity } from "@/lib/db";
import { canExportDocx, type Plan } from "@/lib/limits";
import { generateLetterDocx } from "@/lib/generate-letter-docx";
import { isLetterTemplateId, letterFileName, letterRequest } from "@/lib/letter-templates";
import type { ResumeData } from "@/lib/types";

/** Cover letter or resignation letter as an editable Word file (Pro, like resume Word export). */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const user = await getUserById(userId);
  const check = canExportDocx((user?.plan ?? "free") as Plan);
  if (!check.allowed) return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 402 });

  const body = await req.json().catch(() => null);
  const resume = body?.resume as ResumeData | undefined;
  const r = letterRequest(body);
  if (!resume?.contact || !r.letter.trim()) return NextResponse.json({ error: "Write the letter first." }, { status: 400 });
  if (!isLetterTemplateId(r.design)) return NextResponse.json({ error: "Pick a letter design." }, { status: 400 });

  const buffer = await generateLetterDocx({
    resume,
    letter: r.letter,
    design: r.design,
    company: r.company,
    kind: r.kind,
    manager: r.manager,
    name: r.name,
    headline: r.headline,
  });
  await logActivity(userId, r.kind === "resignation" ? "resignation_docx_exported" : "letter_docx_exported", r.design);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${letterFileName(resume, "docx", r.kind, r.name)}"`,
    },
  });
}
