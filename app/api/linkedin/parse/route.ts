import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { extractTextFromFile } from "@/lib/extract-text";
import { splitLinkedInPdf } from "@/lib/linkedin";
import { publicMessage } from "@/lib/public-error";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { getUserById } from "@/lib/db";

export const runtime = "nodejs";

/** Reads the text of a LinkedIn PDF export and splits it into sections. No AI, and the file and its text are not stored. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const user = await getUserById(userId);
  if (user?.plan !== "pro") return NextResponse.json({ error: "The LinkedIn tools are a Pro feature.", upgradeRequired: true }, { status: 402 });

  const rate = await checkAndRecordRateLimit(userId, "linkedin-parse", 10, 10);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  if (Number(req.headers.get("content-length") ?? 0) > 6 * 1024 * 1024) return NextResponse.json({ error: "File is too large (max 5MB)" }, { status: 400 });
  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  if (!file.name.toLowerCase().endsWith(".pdf")) return NextResponse.json({ error: "Upload the PDF that LinkedIn gives you (More > Save to PDF)." }, { status: 400 });
  if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: "File is too large (max 5MB)" }, { status: 400 });

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") return NextResponse.json({ error: "That file is not a PDF. Upload the PDF that LinkedIn gives you." }, { status: 400 });
    const text = await extractTextFromFile(buffer, file.name);
    if (text.trim().length < 40) {
      return NextResponse.json({ error: "Couldn't find readable text in that PDF. Paste your sections instead." }, { status: 400 });
    }
    return NextResponse.json({ sections: splitLinkedInPdf(text) });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: publicMessage(err, "Couldn't read that file") }, { status: 400 });
  }
}
