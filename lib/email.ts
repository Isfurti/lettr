/**
 * Base email sender via Resend. Returns whether it was actually sent -
 * false either means Resend isn't configured (no RESEND_API_KEY) or the
 * send genuinely failed. Callers decide what to do with that - some
 * treat "not sent" as fine to ignore (support notifications), others
 * need to tell the user explicitly (verification, password reset).
 */
export async function sendEmail(params: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not configured" };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: params.to,
        reply_to: params.replyTo,
        subject: params.subject,
        text: params.text,
      }),
    });
    if (!res.ok) return { sent: false, reason: `Resend returned ${res.status}` };
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: err instanceof Error ? err.message : "Unknown error" };
  }
}

function getAppUrl(): string {
  return process.env.NEXTAUTH_URL || "http://localhost:3000";
}

export async function sendVerificationEmail(email: string, token: string): Promise<{ sent: boolean; reason?: string }> {
  const link = `${getAppUrl()}/verify-email?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Verify your Lettr email",
    text: `Welcome to Lettr! Verify your email to finish setting up your account:\n\n${link}\n\nThis link expires in 24 hours.`,
  });
}

export async function sendPasswordResetEmail(email: string, token: string): Promise<{ sent: boolean; reason?: string }> {
  const link = `${getAppUrl()}/reset-password?token=${token}`;
  return sendEmail({
    to: email,
    subject: "Reset your Lettr password",
    text: `Someone requested a password reset for this Lettr account. If that was you, set a new password here:\n\n${link}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
  });
}

export async function sendReviewReplyEmail(email: string, reply: string): Promise<{ sent: boolean; reason?: string }> {
  return sendEmail({
    to: email,
    subject: "Thanks for your feedback on Lettr",
    text: `${reply}\n\n— The Lettr team`,
  });
}
