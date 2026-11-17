import { timingSafeEqual } from "node:crypto";

/**
 * Whether a request comes from Vercel's scheduler. Vercel sends
 * `Authorization: Bearer <CRON_SECRET>`. With no CRON_SECRET set nobody is
 * allowed (the jobs send email and start paid AI work, so they fail closed).
 */
export function cronAuthorized(req: Request, secret = process.env.CRON_SECRET): boolean {
  if (!secret) return false;
  const sent = Buffer.from(req.headers.get("authorization") ?? "");
  const want = Buffer.from(`Bearer ${secret}`);
  return sent.length === want.length && timingSafeEqual(sent, want);
}
