import { NextResponse } from "next/server";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createInterviewSession, getResume, getUserById } from "@/lib/db";
import { generateInterviewQuestions } from "@/lib/ai";
import { trackAiUsage } from "@/lib/ai-usage";
import { canUseInterviewPractice, type Plan } from "@/lib/limits";
import { recordUse, usageContext, usedSoFar } from "@/lib/free-usage";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import type { ResumeData } from "@/lib/types";

const Schema = z.object({
  role: z.string().trim().min(2, "Add the job title you're interviewing for").max(150),
  company: z.string().trim().max(150).optional(),
  jobPost: z.string().max(10000).optional(),
  resumeId: z.string().max(100).optional(),
});

/** Starts a practice interview: writes six questions for the role. */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const ctx = await usageContext(user ?? { id: userId, email: session?.user?.email });
  const used = await usedSoFar(ctx, "interview");
  const check = canUseInterviewPractice(ctx.tier, "set", used);
  if (!check.allowed) return NextResponse.json({ error: check.reason, upgradeRequired: plan === "free" }, { status: 402 });

  // Daily fair-use limit (resets at midnight India time).
  const daily = await checkDailyAiCap(userId, ctx.tier, "interview");
  if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });

  const rate = await checkAndRecordRateLimit(userId, "interview", 10, 10);
  if (!rate.allowed) return NextResponse.json({ error: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` }, { status: 429 });

  let resume: ResumeData | null = null;
  if (parsed.data.resumeId) {
    const row = await getResume(parsed.data.resumeId, userId);
    if (row) resume = JSON.parse(row.data) as ResumeData;
  }

  try {
    const { value, model, usage } = await generateInterviewQuestions({ ...parsed.data, resume });
    await trackAiUsage({ userId, feature: "interview", model, usage });
    await recordUse(ctx, "interview");
    const row = await createInterviewSession(
      userId,
      parsed.data.role,
      parsed.data.company || null,
      value.map((q) => ({ id: randomUUID(), question: q.question, kind: q.kind }))
    );
    return NextResponse.json({ session: row }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Couldn't write questions." }, { status: 502 });
  }
}
