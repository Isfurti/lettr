import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { getUserByEmail, setPasswordResetToken } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

const Schema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid email" }, { status: 400 });

  const email = parsed.data.email.toLowerCase();

  // Rate limit by email (not by user id, since this route works for
  // logged-out visitors) to stop someone spamming reset emails at a target.
  const rateLimit = await checkAndRecordRateLimit(email, "forgot-password", 3, 15);
  if (!rateLimit.allowed) {
    // Still return the generic message below - don't reveal rate limiting
    // state to a potential attacker either.
    return NextResponse.json({ ok: true });
  }

  const user = await getUserByEmail(email);

  // Always return the same response whether or not the account exists -
  // otherwise this endpoint becomes a way to check which emails are
  // registered, which is a real privacy leak.
  if (user && process.env.RESEND_API_KEY) {
    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    await setPasswordResetToken(user.id, token, expiry);
    await sendPasswordResetEmail(user.email, token);
  }

  return NextResponse.json({ ok: true });
}
