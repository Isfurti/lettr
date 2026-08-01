import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { runAgentTurn } from "@/lib/ai-agent";
import { getUserById } from "@/lib/db";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { canUseAiAgent, type Plan } from "@/lib/limits";

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
  const rateLimit = await checkAndRecordRateLimit(userId, "ai-agent", 15, 10);
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
    const result = await runAgentTurn(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent request failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
