import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { tailorResume } from "@/lib/ai";
import type { ResumeData } from "@/lib/types";
import { trackAiUsage } from "@/lib/ai-usage";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { getUserById } from "@/lib/db";
import { recordUse, usageContext, usedSoFar } from "@/lib/free-usage";
import { canUseTailor } from "@/lib/limits";
import { MARKET_IDS } from "@/lib/market";
import { publicMessage } from "@/lib/public-error";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { MIN_JOB_POST_CHARS, looksLikeResume, planTailor } from "@/lib/tailor";

const Schema = z.object({
  resume: z.unknown(),
  jobPost: z.string().min(MIN_JOB_POST_CHARS).max(8000),
  market: z.enum(MARKET_IDS).optional(),
});

/**
 * Tailor to a job post. Returns a proposal only: reordered skills, reworded
 * summary and bullets, and a list of gaps. Nothing is saved here; the person
 * accepts changes in the panel and saves them as a new version.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const raw = await req.text();
  if (raw.length > 200_000) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {}
  const parsed = Schema.safeParse(body);
  if (!parsed.success || !looksLikeResume(parsed.data.resume)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await getUserById(userId);
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });
  const allowance = canUseTailor(ctx.tier, await usedSoFar(ctx, "tailor"));
  if (!allowance.allowed) return NextResponse.json({ error: allowance.reason, upgradeRequired: true }, { status: 402 });

  const daily = await checkDailyAiCap(userId, ctx.tier, "tailor");
  if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });

  const rate = await checkAndRecordRateLimit(userId, "tailor", 3, 10);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  // Counted before the AI runs, so several requests sent at once cannot all pass the free allowance.
  await recordUse(ctx, "tailor").catch((e) => Sentry.captureException(e));

  try {
    const resume = parsed.data.resume as ResumeData;
    const { jobPost, market } = parsed.data;
    const plan = planTailor(resume, jobPost);
    const { value, model, usage } = await tailorResume({
      summary: resume.summary,
      skills: resume.skills,
      targets: plan.targets,
      jobPost,
      market,
    });
    await trackAiUsage({ userId, feature: "tailor", model, usage });
    return NextResponse.json({
      gaps: plan.gaps,
      matched: plan.matched,
      skillOrder: plan.skillOrder,
      skillNote: plan.skillNote ?? null,
      summaryOptions: value.summaryOptions,
      bullets: value.bullets,
      noSafeRewrite: value.noSafeRewrite,
      canSaveVersion: ctx.tier === "pro",
    });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: publicMessage(err, "AI generation failed") }, { status: 502 });
  }
}
