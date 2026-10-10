import { NextResponse } from "next/server";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getCachedAiResult, getUserById, saveCachedAiResult } from "@/lib/db";
import { canUseCoverLetterBuilder, PLAN_LIMITS, type Plan } from "@/lib/limits";
import { recordUse, usageContext, usedSoFar } from "@/lib/free-usage";
import { buildCoverLetterPrompt, generateCoverLetter } from "@/lib/ai";
import { aiCacheKey, coverLetterModel } from "@/lib/ai-costs";
import { trackAiUsage } from "@/lib/ai-usage";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  resume: z.any(),
  jobDescription: z.string().min(10).max(10000),
  companyName: z.string().max(200).optional(),
  /** "Write another version": skip the saved letter and write a new one. */
  fresh: z.boolean().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });

  const rateLimit = await checkAndRecordRateLimit(userId, "cover-letter", 15, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  // Free plan: Haiku. Pro: Sonnet.
  const model = coverLetterModel(plan);
  const prompt = buildCoverLetterPrompt(parsed.data);
  const cacheKey = aiCacheKey("cover_letter", [model, userId, prompt]);
  const limit = PLAN_LIMITS[ctx.tier].coverLetters;
  const remaining = async () =>
    Number.isFinite(limit) ? Math.max(0, limit - (await usedSoFar(ctx, "cover_letter"))) : null;

  // Same resume and job post as before: hand back the letter we already wrote.
  if (!parsed.data.fresh) {
    const saved = await getCachedAiResult<string>(cacheKey, userId);
    if (saved) {
      await trackAiUsage({ userId, feature: "cover_letter", model, reused: true });
      return NextResponse.json({ letter: saved, reused: true, remaining: await remaining() });
    }
  }

  const used = Number.isFinite(limit) ? await usedSoFar(ctx, "cover_letter") : 0;
  const check = canUseCoverLetterBuilder(ctx.tier, used);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 402 });
  }

  // Daily fair-use limit (resets at midnight India time).
  const daily = await checkDailyAiCap(userId, ctx.tier, "cover_letter");
  if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });

  try {
    const { value: letter, usage } = await generateCoverLetter(prompt, model);
    await trackAiUsage({ userId, feature: "cover_letter", model, usage });
    await saveCachedAiResult(cacheKey, userId, "cover_letter", letter);
    await recordUse(ctx, "cover_letter");
    return NextResponse.json({ letter, reused: false, remaining: Number.isFinite(limit) ? Math.max(0, limit - used - 1) : null });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
