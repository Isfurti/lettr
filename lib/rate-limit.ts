import { countRecentRateLimitEvents, deleteLatestRateLimitEvent, recordRateLimitEvent } from "./db";

/** Checks a limit without counting this call (pair with recordRateLimitHit, e.g. to count only failed logins). */
export async function isRateLimited(key: string, endpoint: string, maxRequests: number, windowMinutes: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60_000);
  const { count } = await countRecentRateLimitEvents(key, endpoint, windowStart);
  return count >= maxRequests;
}

export async function recordRateLimitHit(key: string, endpoint: string): Promise<void> {
  await recordRateLimitEvent(key, endpoint);
}

/**
 * Gives back a use recorded by checkAndRecordRateLimit, for when the thing it
 * allowed didn't happen (the AI call failed), so a failure never costs a free try.
 */
export async function refundRateLimit(userId: string, endpoint: string): Promise<void> {
  await deleteLatestRateLimitEvent(userId, endpoint).catch(() => {});
}

export type RateLimitResult = { allowed: true } | { allowed: false; retryAfterSeconds: number };

/**
 * Sliding-window rate limit: counts how many times this user has hit this
 * endpoint in the last `windowMinutes`. If under the limit, records this
 * call and allows it. If at/over the limit, rejects without recording
 * (so a blocked user isn't further penalized).
 *
 * Backed by Postgres rather than an in-memory Map because Vercel runs
 * multiple serverless instances - in-memory state wouldn't be shared
 * between them and the limit would be trivially bypassable.
 */
export async function checkAndRecordRateLimit(
  userId: string,
  endpoint: string,
  maxRequests: number,
  windowMinutes: number
): Promise<RateLimitResult> {
  const windowStart = new Date(Date.now() - windowMinutes * 60_000);
  const { count, oldest } = await countRecentRateLimitEvents(userId, endpoint, windowStart);

  if (count >= maxRequests) {
    const oldestDate = new Date(oldest as string);
    const retryAfterMs = oldestDate.getTime() + windowMinutes * 60_000 - Date.now();
    return { allowed: false, retryAfterSeconds: Math.max(1, Math.ceil(retryAfterMs / 1000)) };
  }

  await recordRateLimitEvent(userId, endpoint);
  return { allowed: true };
}
