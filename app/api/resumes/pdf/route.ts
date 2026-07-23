import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { auth } from "@/lib/auth";
import { ResumePdfDocument } from "@/components/ResumePdfDocument";
import type { ResumeData } from "@/lib/types";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const resume = body?.resume as ResumeData | undefined;
  if (!resume) return NextResponse.json({ error: "Missing resume data" }, { status: 400 });

  const buffer = await renderToBuffer(ResumePdfDocument({ resume }));

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${(resume.contact.fullName || "resume").replace(/\s+/g, "_")}.pdf"`,
    },
  });
}
