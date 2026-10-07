import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getUserById, recordAiFeedback } from "@/lib/db";
import { anonymize } from "@/lib/anonymize";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  feature: z.enum(["bullets", "summary"]),
  action: z.enum(["kept", "edited", "rejected"]),
  input: z.string().max(2000).optional(),
  suggestion: z.string().max(2000).optional(),
  final: z.string().max(2000).optional(),
  names: z.array(z.string().max(200)).max(5).optional(),
  companies: z.array(z.string().max(200)).max(20).optional(),
});

/**
 * Learning loop: whether an AI suggestion was kept, edited or rejected.
 * Everyone counts towards the totals; the text itself is only kept for
 * users who turned on "Help improve Lettr's AI", with personal details removed.
 */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id ?? null;
  if (!userId) return NextResponse.json({ ok: true }); // guests: not recorded
  const limit = await checkAndRecordRateLimit(userId, "ai-feedback", 120, 10);
  if (!limit.allowed) return NextResponse.json({ ok: true });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const d = parsed.data;
  const user = await getUserById(userId);
  const keepText = Boolean(user?.ai_improvement_consent);
  const known = { names: [...(d.names ?? []), user?.name ?? ""].filter(Boolean), companies: d.companies };
  const clean = (t?: string) => (keepText && t ? anonymize(t, known) : null);

  await recordAiFeedback({
    userId,
    feature: d.feature,
    action: d.action,
    inputText: clean(d.input),
    suggestionText: clean(d.suggestion),
    finalText: clean(d.final),
  });
  return NextResponse.json({ ok: true });
}
