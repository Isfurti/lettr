import { NextResponse } from "next/server";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { atsAnalystAdvice } from "@/lib/ai";
import { analyzeAts } from "@/lib/ats-analyst";
import { trackAiUsage } from "@/lib/ai-usage";
import { recordUse, usageContext, usedSoFar } from "@/lib/free-usage";
import { canUseAtsAnalyst, type Plan } from "@/lib/limits";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import type { ResumeData } from "@/lib/types";

const Schema = z.object({
  resume: z.any(),
  template: z.string().max(40).default("classic"),
  jobPost: z.string().max(10000).optional(),
});

/** The AI read-out for the ATS score: what it means and concrete rewrites. */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Create a free account to get the analyst's advice.", signup: true }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  const resume = parsed.success ? (parsed.data.resume as ResumeData) : null;
  if (!parsed.success || !resume?.contact || !Array.isArray(resume.experience)) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const ctx = await usageContext(user ?? { id: userId, email: session?.user?.email });
  const check = canUseAtsAnalyst(ctx.tier, await usedSoFar(ctx, "ats_analyst"));
  if (!check.allowed) return NextResponse.json({ error: check.reason, upgradeRequired: plan === "free" }, { status: 402 });
  // Daily fair-use limit (resets at midnight India time).
  const daily = await checkDailyAiCap(userId, ctx.tier, "ats_analyst");
  if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });

  const rate = await checkAndRecordRateLimit(userId, "ats-analyst", 10, 10);
  if (!rate.allowed) return NextResponse.json({ error: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` }, { status: 429 });

  const report = analyzeAts(resume, parsed.data.template, parsed.data.jobPost);
  try {
    const { value, model, usage } = await atsAnalystAdvice({
      resume,
      jobPost: parsed.data.jobPost,
      score: report.overall,
      issues: report.categories.flatMap((c) => c.checks).filter((x) => x.status !== "pass").map((x) => `${x.label}: ${x.detail}`),
      missingKeywords: report.keywords?.missingKeywords ?? [],
    });
    await trackAiUsage({ userId, feature: "ats_analyst", model, usage });
    await recordUse(ctx, "ats_analyst");
    return NextResponse.json({ advice: value });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "The analyst couldn't finish." }, { status: 502 });
  }
}
