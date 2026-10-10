import { NextResponse } from "next/server";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { polishBullet } from "@/lib/ai";
import { logActivity, getUserById, incrementAiWritingAssistCount } from "@/lib/db";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { canUseAiWritingAssist, type Plan } from "@/lib/limits";
import { recordUse, rewritesUsed, usageContext } from "@/lib/free-usage";
import { trackAiUsage } from "@/lib/ai-usage";

const Schema = z.object({
  roughBullet: z.string().min(3).max(1000),
  role: z.string().min(1).max(200),
  targetJobDescription: z.string().max(5000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  // Lifetime cap for free users - separate from the rate limit below, which
  // only guards against rapid abuse and resets every 10 minutes. This one
  // bounds a free user's total AI cost to a small, fixed, one-time amount.
  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });
  const assistCheck = canUseAiWritingAssist(ctx.tier, await rewritesUsed(ctx, user?.ai_writing_assist_count ?? 0));
  if (!assistCheck.allowed) {
    return NextResponse.json({ error: assistCheck.reason, upgradeRequired: true }, { status: 402 });
  }

  // Daily fair-use limit (resets at midnight India time).
  const daily = await checkDailyAiCap(userId, ctx.tier, "rewrite");
  if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });

  const rateLimit = await checkAndRecordRateLimit(userId, "generate-bullets", 20, 10);
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

  try {
    const { value: options, model, usage } = await polishBullet(parsed.data);
    await trackAiUsage({ userId, feature: "bullets", model, usage });
    await logActivity(userId, "ai_polish_applied", parsed.data.role);
    if (plan === "free") {
      await incrementAiWritingAssistCount(userId);
      await recordUse(ctx, "rewrite");
    }
    return NextResponse.json({ options });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
