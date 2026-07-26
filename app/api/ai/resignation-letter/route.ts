import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getUserById } from "@/lib/db";
import { canUseResignationLetterBuilder, type Plan } from "@/lib/limits";
import { generateResignationLetter } from "@/lib/ai";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  employeeName: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  jobTitle: z.string().min(1).max(200),
  lastDay: z.string().min(1).max(100),
  reason: z.string().max(1000).optional(),
  tone: z.enum(["warm", "neutral", "brief"]).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
  const user = await getUserById(userId);
  const plan = (user?.plan ?? "free") as Plan;
  const check = canUseResignationLetterBuilder(plan);
  if (!check.allowed) {
    return NextResponse.json({ error: check.reason, upgradeRequired: true }, { status: 402 });
  }

  const rateLimit = await checkAndRecordRateLimit(userId, "resignation-letter", 15, 10);
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
    const letter = await generateResignationLetter(parsed.data);
    return NextResponse.json({ letter });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
