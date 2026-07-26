import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { polishBullet } from "@/lib/ai";
import { logActivity } from "@/lib/db";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  roughBullet: z.string().min(3).max(1000),
  role: z.string().min(1).max(200),
  targetJobDescription: z.string().max(5000).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;
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
    const options = await polishBullet(parsed.data);
    await logActivity(userId, "ai_polish_applied", parsed.data.role);
    return NextResponse.json({ options });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI generation failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
