/**
 * Best-effort admin notification email. If RESEND_API_KEY / ADMIN_EMAIL
 * aren't set, this silently does nothing - the support message is still
 * saved to the database either way, so nothing is lost, you just won't get
 * a push notification about it until you check /admin/support.
 */
export async function notifyAdminOfSupportMessage(params: {
  fromEmail: string;
  subject: string;
  message: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!apiKey || !adminEmail) return;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
        to: adminEmail,
        reply_to: params.fromEmail,
        subject: `[Lettr support] ${params.subject}`,
        text: `From: ${params.fromEmail}\n\n${params.message}`,
      }),
    });
  } catch {
    // Never let a notification failure break the actual support submission -
    // the message is already saved in the database at this point.
  }
}
