import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { deleteAiExamplesForUser, logActivity, setAiImprovementConsent } from "@/lib/db";

/** "Help improve Lettr's AI": opt in or out. Opting out deletes the examples already saved. */
export async function POST(req: Request) {
  const session = await auth();
  const userId = (session?.user as { id?: string } | undefined)?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = z.object({ consent: z.boolean() }).safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  await setAiImprovementConsent(userId, parsed.data.consent);
  if (!parsed.data.consent) await deleteAiExamplesForUser(userId);
  await logActivity(userId, parsed.data.consent ? "ai_consent_on" : "ai_consent_off");
  return NextResponse.json({ ok: true, consent: parsed.data.consent });
}
