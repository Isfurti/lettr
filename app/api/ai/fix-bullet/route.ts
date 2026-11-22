import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { polishBullet } from "@/lib/ai";
import { trackAiUsage } from "@/lib/ai-usage";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { getUserById } from "@/lib/db";
import { recordUse, usageContext, usedSoFar } from "@/lib/free-usage";
import { canUseAiFix } from "@/lib/limits";
import { MARKET_IDS } from "@/lib/market";
import { publicMessage } from "@/lib/public-error";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  bullet: z.string().min(5).max(600),
  role: z.string().max(200).default(""),
  market: z.enum(MARKET_IDS).optional(),
});

/** Rewrites one duty bullet as a result, using only what the bullet says. Counts as an "AI fix". */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const user = await getUserById(userId);
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });
  const allowance = canUseAiFix(ctx.tier, await usedSoFar(ctx, "fix"));
  if (!allowance.allowed) return NextResponse.json({ error: allowance.reason, upgradeRequired: true }, { status: 402 });

  const daily = await checkDailyAiCap(userId, ctx.tier, "fix");
  if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });

  const rate = await checkAndRecordRateLimit(userId, "fix-bullet", 20, 10);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const { bullet, role, market } = parsed.data;
    const { value: options, model, usage } = await polishBullet({ roughBullet: bullet, role: role || "the role", market, grounded: true });
    await trackAiUsage({ userId, feature: "fix", model, usage });
    await recordUse(ctx, "fix").catch((e) => Sentry.captureException(e));
    return NextResponse.json({ options });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: publicMessage(err, "AI generation failed") }, { status: 502 });
  }
}
