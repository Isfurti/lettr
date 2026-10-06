import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { polishBullet, generateSummary } from "@/lib/ai";
import { trackAiUsage } from "@/lib/ai-usage";
import { anonymousClientKey } from "@/lib/client-key";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("bullet"), text: z.string().trim().min(3).max(1000), role: z.string().max(200).optional() }),
  z.object({
    kind: z.literal("summary"),
    role: z.string().max(200).optional(),
    experience: z
      .array(z.object({ role: z.string().max(200), company: z.string().max(200), startDate: z.string().max(50), endDate: z.string().max(50), bullets: z.array(z.string().max(1000)).max(20) }))
      .max(15),
    skills: z.array(z.string().max(100)).max(60),
  }),
]);

/**
 * One free AI rewrite for visitors who haven't signed up yet, so they can
 * feel what Lettr's AI does before making an account. One per visitor per
 * day (by hashed internet address), with a site-wide daily ceiling.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (session?.user) return NextResponse.json({ error: "Use the normal AI button while signed in." }, { status: 400 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Write something first, then try again." }, { status: 400 });

  const key = anonymousClientKey(req.headers);
  const mine = await checkAndRecordRateLimit(key, "guest-rewrite", 1, 24 * 60);
  if (!mine.allowed) {
    return NextResponse.json({ error: "You've used your free AI rewrite. Create a free account for 5 more.", signup: true }, { status: 429 });
  }
  const everyone = await checkAndRecordRateLimit("guest-rewrite:all", "guest-rewrite-global", 2000, 24 * 60);
  if (!everyone.allowed) {
    return NextResponse.json({ error: "Free AI rewrites are busy right now. Create a free account to keep going.", signup: true }, { status: 429 });
  }

  try {
    const d = parsed.data;
    const result =
      d.kind === "bullet"
        ? await polishBullet({ roughBullet: d.text, role: d.role || "professional" })
        : await generateSummary({
            experience: d.experience.map((e, i) => ({ ...e, id: String(i) })),
            skills: d.skills,
            targetRole: d.role,
          });
    await trackAiUsage({ userId: null, feature: d.kind === "bullet" ? "bullets" : "summary", model: result.model, usage: result.usage });
    return NextResponse.json({ options: result.value });
  } catch {
    return NextResponse.json({ error: "Couldn't rewrite that right now. Try again in a moment." }, { status: 502 });
  }
}
