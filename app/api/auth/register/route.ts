import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes } from "node:crypto";
import { createUser, getUserByEmail, setEmailVerificationToken } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/email";
import { getCountryFromHeaders, getTierForCountry } from "@/lib/pricing-region";

const RegisterSchema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;
  const normalizedEmail = email.toLowerCase();

  if (await getUserByEmail(normalizedEmail)) {
    return NextResponse.json({ error: "An account with that email already exists" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const id = randomUUID();

  // Captured once, at signup, rather than re-detected on every future
  // request - this gives the user a stable price they can plan around
  // instead of one that shifts if they later browse from a different
  // location or a VPN. Only works on Vercel (or another host that sets
  // this header); elsewhere it's null and they land in the default "full"
  // tier via getTierForCountry's fallback.
  const countryCode = getCountryFromHeaders(req.headers);
  const pricingTier = getTierForCountry(countryCode);

  // If no email service is configured, we can't send a verification link at
  // all - blocking signups on an email we're incapable of sending would be
  // worse than not verifying. Auto-verify in that case instead.
  const emailServiceConfigured = Boolean(process.env.RESEND_API_KEY);
  await createUser({
    id,
    email: normalizedEmail,
    passwordHash,
    name,
    emailVerified: !emailServiceConfigured,
    countryCode: countryCode ?? undefined,
    pricingTier,
  });

  let verificationEmailSent = false;
  if (emailServiceConfigured) {
    const token = randomBytes(32).toString("hex");
    const expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await setEmailVerificationToken(id, token, expiry);
    const result = await sendVerificationEmail(normalizedEmail, token);
    verificationEmailSent = result.sent;
  }

  return NextResponse.json({ id, email: normalizedEmail, name, verificationEmailSent }, { status: 201 });
}
