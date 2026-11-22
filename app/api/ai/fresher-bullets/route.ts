import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { draftFresherBullets } from "@/lib/ai";
import { trackAiUsage } from "@/lib/ai-usage";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { getUserById } from "@/lib/db";
import { FRESHER_KINDS, FRESHER_LIMITS, fresherAnswersProblem } from "@/lib/fresher";
import { recordUse, usageContext, usedSoFar } from "@/lib/free-usage";
import { canUseFresherBullets } from "@/lib/limits";
import { MARKET_IDS } from "@/lib/market";
import { publicMessage } from "@/lib/public-error";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  kind: z.enum(FRESHER_KINDS.map((k) => k.id) as [string, ...string[]]),
  name: z.string().max(FRESHER_LIMITS.name),
  what: z.string().max(FRESHER_LIMITS.what),
  tools: z.string().max(FRESHER_LIMITS.tools).default(""),
  result: z.string().max(FRESHER_LIMITS.result).default(""),
  market: z.enum(MARKET_IDS).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const { market, ...rest } = parsed.data;
  const answers = { ...rest, kind: rest.kind as (typeof FRESHER_KINDS)[number]["id"] };
  const problem = fresherAnswersProblem(answers);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });

  // Plan allowance first: 3 for life on free, 5 a month on legacy free, unlimited on Pro.
  const user = await getUserById(userId);
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });
  const allowance = canUseFresherBullets(ctx.tier, await usedSoFar(ctx, "fresher_bullet"));
  if (!allowance.allowed) {
    return NextResponse.json({ error: allowance.reason, upgradeRequired: true }, { status: 402 });
  }

  // Daily fair-use limit (resets at midnight India time).
  const daily = await checkDailyAiCap(userId, ctx.tier, "fresher_bullet");
  if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });

  const rate = await checkAndRecordRateLimit(userId, "fresher-bullets", 20, 10);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const { value: options, model, usage } = await draftFresherBullets({ answers, market });
    await trackAiUsage({ userId, feature: "fresher_bullet", model, usage });
    await recordUse(ctx, "fresher_bullet");
    return NextResponse.json({ options });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: publicMessage(err, "AI generation failed") }, { status: 502 });
  }
}
