import { NextResponse } from "next/server";
import { checkDailyAiCap } from "@/lib/daily-caps";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { runAgentTurn, AGENT_MODEL } from "@/lib/ai-agent";
import { countAiUses, getUserById } from "@/lib/db";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { canSendAgentMessage, canUseAiAgent, limitTier, type Plan } from "@/lib/limits";
import { monthStartIST } from "@/lib/ai-costs";
import { trackAiUsage } from "@/lib/ai-usage";

const Schema = z.object({
  resumeData: z.any(),
  history: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })).default([]),
  userMessage: z.string().min(1).max(2000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  // Pro-only - this is the most expensive AI feature by far (up to 5
  // Anthropic calls per single message), so it's the one gated by plan
  // rather than just capped, unlike bullet/summary AI.
  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const agentCheck = canUseAiAgent(plan);
  if (!agentCheck.allowed) {
    return NextResponse.json({ error: agentCheck.reason, upgradeRequired: true }, { status: 402 });
  }

  // Tighter limit than the other AI endpoints - each agent turn can
  // internally make up to 5 Anthropic calls (tool-use loop), so this is
  // the endpoint most worth capping.
  // Daily fair-use limit (resets at midnight India time).
  const daily = await checkDailyAiCap(userId, limitTier(user), "agent");
  if (!daily.allowed) return NextResponse.json({ error: daily.reason, dailyCap: true }, { status: 429 });

  const rateLimit = await checkAndRecordRateLimit(userId, "ai-agent", 15, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  // Monthly fair-use cap, lower in cheaper price regions (lib/ai-costs.ts).
  const used = await countAiUses(userId, "agent", monthStartIST());
  const cap = canSendAgentMessage(user?.pricing_tier, used);
  if (!cap.allowed) {
    return NextResponse.json({ error: cap.reason, capReached: true, usage: { used, limit: cap.limit } }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const { usage, ...result } = await runAgentTurn(parsed.data);
    await trackAiUsage({ userId, feature: "agent", model: AGENT_MODEL, usage });
    return NextResponse.json({ ...result, usage: { used: used + 1, limit: cap.limit } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
