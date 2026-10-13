import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { auth } from "@/lib/auth";
import { createSupportMessage } from "@/lib/db";
import { notifyAdminOfSupportMessage } from "@/lib/notify";
import { anonymousClientKey } from "@/lib/client-key";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({
  email: z.string().email(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(5000),
});

export async function POST(req: Request) {
  const session = await auth();
  const userId = session?.user ? (session.user as { id: string }).id : null;

  // Public form: keep it from being used to flood the inbox.
  const rate = await checkAndRecordRateLimit(userId ?? anonymousClientKey(req.headers), "support", 5, 15);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `You've sent a few messages already. Please wait ${Math.ceil(rate.retryAfterSeconds / 60)} minutes and try again.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const id = randomUUID();
  await createSupportMessage({ id, userId, ...parsed.data });

  // Best-effort - never blocks or fails the request if email isn't configured
  await notifyAdminOfSupportMessage({
    fromEmail: parsed.data.email,
    subject: parsed.data.subject,
    message: parsed.data.message,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
