import { sendEmail } from "./email";
import { COMPANY } from "./company";

/**
 * Best-effort notification for a new support message, sent to the support
 * inbox (falls back to ADMIN_EMAIL). Replying to it goes to the customer.
 * If email isn't set up, this silently does nothing - the support message is still
 * saved to the database either way, so nothing is lost, you just won't get
 * a push notification about it until you check /admin/support.
 */
export async function notifyAdminOfSupportMessage(params: {
  fromEmail: string;
  subject: string;
  message: string;
}): Promise<void> {
  const to = COMPANY.contactEmail ?? process.env.ADMIN_EMAIL;
  if (!to) return;

  await sendEmail({
    to,
    replyTo: params.fromEmail,
    subject: `[Lettr support] ${params.subject}`,
    text: `From: ${params.fromEmail}\n\n${params.message}`,
  });
}
