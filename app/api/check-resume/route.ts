import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { extractTextFromFile } from "@/lib/extract-text";
import { extractResumeFromText } from "@/lib/ai";
import { analyzeResumeText } from "@/lib/ats-read";
import { scoreResumeQuality } from "@/lib/resume-score";
import { anonymousClientKey } from "@/lib/client-key";
import { trackAiUsage } from "@/lib/ai-usage";

export const runtime = "nodejs";

const MAX_SIZE = 5 * 1024 * 1024;

/**
 * Free resume checker - works without an account.
 * Returns what hiring software reads from the file, simple read checks, and
 * (when the AI step succeeds) the structured resume plus its Lettr score.
 * Nothing is saved: the file and results only live in this request.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  const key = userId ?? anonymousClientKey(req.headers);

  // Uses the AI import step, so keep it cheap to offer for free:
  // a few checks an hour, and a daily cap, per person.
  const hourly = await checkAndRecordRateLimit(key, "resume-check-hour", userId ? 10 : 5, 60);
  if (!hourly.allowed) {
    return NextResponse.json(
      { error: `You've checked a few resumes already. Try again in ${Math.ceil(hourly.retryAfterSeconds / 60)} minutes.` },
      { status: 429, headers: { "Retry-After": String(hourly.retryAfterSeconds) } }
    );
  }
  const daily = await checkAndRecordRateLimit(key, "resume-check-day", userId ? 30 : 15, 24 * 60);
  if (!daily.allowed) {
    return NextResponse.json(
      { error: "That's the most checks we can do today. Please try again tomorrow." },
      { status: 429, headers: { "Retry-After": String(daily.retryAfterSeconds) } }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Please choose a PDF or Word file." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "That file is too big. The limit is 5 MB." }, { status: 400 });
  }

  let text: string;
  try {
    text = await extractTextFromFile(Buffer.from(await file.arrayBuffer()), file.name);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "We couldn't open that file." },
      { status: 400 }
    );
  }

  const trimmed = text.trim();
  if (trimmed.length < 20) {
    return NextResponse.json(
      {
        error:
          "We couldn't find any text in that file. It may be a scanned image, which most job sites can't read either.",
      },
      { status: 422 }
    );
  }

  const read = analyzeResumeText(trimmed);

  let data = null;
  let score = null;
  try {
    const result = await extractResumeFromText(trimmed);
    data = result.value;
    await trackAiUsage({ userId: userId ?? null, feature: "check", model: result.model, usage: result.usage });
    const q = scoreResumeQuality(data);
    score = {
      overall: q.overall,
      tips: [...q.sections]
        .filter((s) => s.tips.length > 0)
        .sort((a, b) => a.score - b.score)
        .flatMap((s) => s.tips.map((tip) => ({ section: s.label, tip }))),
    };
  } catch {
    // The read checks still work without the AI step; the page explains the score is unavailable.
  }

  return NextResponse.json({
    fileName: file.name,
    text: trimmed.slice(0, 8000),
    truncated: trimmed.length > 8000,
    read,
    data,
    score,
  });
}
