import { NextResponse } from "next/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { optimiseLinkedIn } from "@/lib/ai";
import { keywordInText } from "@/lib/ats-score";
import { trackAiUsage } from "@/lib/ai-usage";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { getUserById } from "@/lib/db";
import { recordUse, refundUse, usageContext, usedSoFar } from "@/lib/free-usage";
import { capSections, INPUT_CAPS, sourceFacts } from "@/lib/linkedin";
import { canUseLinkedin } from "@/lib/limits";
import { MARKET_IDS } from "@/lib/market";
import { publicMessage } from "@/lib/public-error";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  sections: z.object({ headline: z.string(), about: z.string(), experience: z.string(), skills: z.string() }),
  targetRole: z.string().min(2).max(INPUT_CAPS.targetRole),
  market: z.enum(MARKET_IDS).optional(),
});

/**
 * Rewrites the pasted LinkedIn sections. The text goes to the AI for this one
 * request only: nothing is saved, cached or logged except the usage event
 * (token counts) every AI route writes.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  if (Number(req.headers.get("content-length") ?? 0) > 120_000) return NextResponse.json({ error: "That is too much text. Shorten it and try again." }, { status: 400 });
  const raw = await req.text();
  if (raw.length > 60_000) return NextResponse.json({ error: "That is too much text. Shorten it and try again." }, { status: 400 });
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {}
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const sections = capSections(parsed.data.sections);
  if ((sections.headline + sections.about + sections.experience).trim().length < 40) {
    return NextResponse.json({ error: "Add some text from your profile first: a headline, About or experience." }, { status: 400 });
  }

  const user = await getUserById(userId);
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });
  const allowance = canUseLinkedin(ctx.tier, await usedSoFar(ctx, "linkedin"));
  if (!allowance.allowed) return NextResponse.json({ error: allowance.reason, upgradeRequired: true }, { status: 402 });

  const daily = await checkDailyAiCap(userId, ctx.tier, "linkedin");
  if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });

  const rate = await checkAndRecordRateLimit(userId, "linkedin", 3, 10);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  // Counted before the AI runs, so several requests sent at once cannot all pass the free allowance.
  await recordUse(ctx, "linkedin").catch((e) => Sentry.captureException(e));

  try {
    const { targetRole, market } = parsed.data;
    const { value, model, usage } = await optimiseLinkedIn({ sections, targetRole, market });
    await trackAiUsage({ userId, feature: "linkedin", model, usage });
    if (!value.headlines.length && !value.about.length && !value.experience.length) {
      // Nothing safe came back: the person got nothing, so the try is given back.
      await refundUse(ctx, "linkedin").catch((e) => Sentry.captureException(e));
      return NextResponse.json({ error: "Couldn't write anything that sticks to your own words this time. Add more detail to your profile text and try again. Your try was not used." }, { status: 422 });
    }
    const facts = sourceFacts(sections, targetRole);
    const have: string[] = [];
    const addIfTrue: string[] = [];
    for (const k of value.roleKeywords) (keywordInText(k, facts) ? have : addIfTrue).push(k);
    return NextResponse.json({ headlines: value.headlines, about: value.about, experience: value.experience, keywordsYouShow: have, keywordsAddIfTrue: addIfTrue });
  } catch (err) {
    Sentry.captureException(err);
    await refundUse(ctx, "linkedin").catch((e) => Sentry.captureException(e));
    return NextResponse.json({ error: publicMessage(err, "AI generation failed") }, { status: 502 });
  }
}
