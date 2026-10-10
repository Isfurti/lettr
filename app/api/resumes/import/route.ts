import { NextResponse } from "next/server";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { auth } from "@/lib/auth";
import { getUserById, countResumesForUser, upsertResume, logActivity, getCachedAiResult, saveCachedAiResult } from "@/lib/db";
import { canCreateResume, limitTier, type Plan } from "@/lib/limits";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { extractTextFromFile } from "@/lib/extract-text";
import { extractResumeFromText, normalizeExtractedResume, IMPORT_MODEL } from "@/lib/ai";
import { aiCacheKey } from "@/lib/ai-costs";
import { trackAiUsage } from "@/lib/ai-usage";
import type { ResumeData } from "@/lib/types";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  // Same free-tier resume cap applies to an imported resume as a created
  // one - importing isn't a way around the plan limit.
  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const currentCount = await countResumesForUser(userId);
  const limitCheck = canCreateResume(plan, currentCount);
  if (!limitCheck.allowed) {
    return NextResponse.json({ error: limitCheck.reason, upgradeRequired: true }, { status: 402 });
  }

  // This calls the AI API, same cost profile as the other AI endpoints.
  const rateLimit = await checkAndRecordRateLimit(userId, "resume-import", 10, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File is too large (max 10MB)" }, { status: 400 });
  }

  let text: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    text = await extractTextFromFile(buffer, file.name);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Couldn't read that file";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (!text.trim() || text.trim().length < 20) {
    return NextResponse.json(
      { error: "Couldn't find readable text in that file. Try a different file, or build manually instead." },
      { status: 400 }
    );
  }

  // Importing the same file again reuses the saved result instead of paying
  // for the AI step twice (entries get fresh ids either way).
  const cacheKey = aiCacheKey("import", [IMPORT_MODEL, userId, text]);
  let resumeData: ResumeData;
  try {
    const saved = await getCachedAiResult<ResumeData>(cacheKey, userId);
    if (saved) {
      resumeData = normalizeExtractedResume(saved);
      await trackAiUsage({ userId, feature: "import", model: IMPORT_MODEL, reused: true });
    } else {
      const daily = await checkDailyAiCap(userId, limitTier(user), "import");
      if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });
      const result = await extractResumeFromText(text);
      resumeData = result.value;
      await trackAiUsage({ userId, feature: "import", model: result.model, usage: result.usage });
      await saveCachedAiResult(cacheKey, userId, "import", resumeData);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI extraction failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }

  const id = randomUUID();
  const title = resumeData.contact.fullName ? `${resumeData.contact.fullName}'s Resume` : "Imported Resume";
  await upsertResume({ id, userId, title, template: "classic", data: JSON.stringify(resumeData) });
  await logActivity(userId, "resume_imported", file.name);

  return NextResponse.json({ id, title }, { status: 201 });
}
