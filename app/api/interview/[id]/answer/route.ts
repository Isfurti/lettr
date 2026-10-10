import { NextResponse } from "next/server";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getInterviewSession, getUserById, saveInterviewQuestions } from "@/lib/db";
import { interviewFeedback } from "@/lib/ai";
import { trackAiUsage } from "@/lib/ai-usage";
import { canUseInterviewPractice, type Plan } from "@/lib/limits";
import { recordUse, usageContext, usedSoFar } from "@/lib/free-usage";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  questionId: z.string().max(100),
  answer: z.string().trim().min(20, "Write a little more - at least a couple of sentences.").max(5000),
});

/** Feedback on one practice answer. */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });

  const practice = await getInterviewSession(userId, id);
  const q = practice?.questions.find((x) => x.id === parsed.data.questionId);
  if (!practice || !q) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const ctx = await usageContext(user ?? { id: userId, email: session?.user?.email });
  const used = await usedSoFar(ctx, "interview_feedback");
  const check = canUseInterviewPractice(ctx.tier, "feedback", used);
  if (!check.allowed) return NextResponse.json({ error: check.reason, upgradeRequired: plan === "free" }, { status: 402 });

  // Daily fair-use limit (resets at midnight India time).
  const daily = await checkDailyAiCap(userId, ctx.tier, "interview_feedback");
  if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });

  const rate = await checkAndRecordRateLimit(userId, "interview-feedback", 20, 10);
  if (!rate.allowed) return NextResponse.json({ error: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` }, { status: 429 });

  try {
    const { value, model, usage } = await interviewFeedback({ role: practice.role, question: q.question, answer: parsed.data.answer });
    await trackAiUsage({ userId, feature: "interview_feedback", model, usage });
    await recordUse(ctx, "interview_feedback");
    const questions = practice.questions.map((x) => (x.id === q.id ? { ...x, answer: parsed.data.answer, feedback: value } : x));
    await saveInterviewQuestions(userId, id, questions);
    return NextResponse.json({ feedback: value });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Couldn't review your answer." }, { status: 502 });
  }
}
