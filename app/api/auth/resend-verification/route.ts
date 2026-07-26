import { NextResponse } from "next/server";
import { randomBytes } from "node:crypto";
import { auth } from "@/lib/auth";
import { getUserById, setEmailVerificationToken } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

export async function POST() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  // Light rate limit - this sends an email, not an AI call, but still
  // shouldn't be spammable.
  const rateLimit = await checkAndRecordRateLimit(userId, "resend-verification", 3, 10);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Please wait before requesting another email. Try again in ${rateLimit.retryAfterSeconds}s.` },
      { status: 429 }
    );
  }

  const user = await getUserById(userId);
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (user.email_verified) return NextResponse.json({ error: "Already verified" }, { status: 400 });

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email sending isn't configured yet." }, { status: 503 });
  }

  const token = randomBytes(32).toString("hex");
  const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await setEmailVerificationToken(userId, token, expiry);
  const result = await sendVerificationEmail(user.email, token);

  if (!result.sent) {
    return NextResponse.json({ error: result.reason ?? "Failed to send email" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
