import { sendEmail } from "./email";

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
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  await sendEmail({
    to: adminEmail,
    replyTo: params.fromEmail,
    subject: `[Lettr support] ${params.subject}`,
    text: `From: ${params.fromEmail}\n\n${params.message}`,
  });
}
