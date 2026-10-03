import { Pool } from "pg";
import { randomUUID } from "node:crypto";

// Every call site in the app only uses the exported functions below, so
// swapping providers (e.g. a different Postgres host, or connection pooling
// service like PgBouncer/Neon's pooler) only ever touches this file.

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Add it to your .env.local, e.g.\n" +
      "DATABASE_URL=postgres://postgres:postgres@localhost:5432/resumeai"
  );
}

const pool = new Pool({
  connectionString,
  ssl: connectionString.includes("localhost") ? false : { rejectUnauthorized: false },
});

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        plan TEXT NOT NULL DEFAULT 'free',
        stripe_customer_id TEXT,
        stripe_subscription_id TEXT,
        pdf_download_count INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      -- safe to run repeatedly: adds the billing columns to a users table
      -- created before this migration existed
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pdf_download_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_writing_assist_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_access_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_refresh_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS google_token_expiry TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verification_expiry TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_expiry TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS country_code TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pricing_tier TEXT;

      CREATE TABLE IF NOT EXISTS support_messages (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        email TEXT NOT NULL,
        subject TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE TABLE IF NOT EXISTS activity_log (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        action TEXT NOT NULL,
        detail TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_activity_log_user ON activity_log(user_id, created_at DESC);

      CREATE TABLE IF NOT EXISTS rate_limit_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        endpoint TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_rate_limit_lookup ON rate_limit_events(user_id, endpoint, created_at);

      CREATE TABLE IF NOT EXISTS admin_audit_log (
        id TEXT PRIMARY KEY,
        admin_user_id TEXT NOT NULL,
        action TEXT NOT NULL,
        target_user_id TEXT,
        detail TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_admin_audit_log_created ON admin_audit_log(created_at DESC);

      CREATE TABLE IF NOT EXISTS reviews (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        rating INTEGER NOT NULL,
        content TEXT NOT NULL,
        sentiment TEXT,
        likes JSONB NOT NULL DEFAULT '[]',
        dislikes JSONB NOT NULL DEFAULT '[]',
        ai_reply TEXT,
        consent_to_feature BOOLEAN NOT NULL DEFAULT false,
        featured BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS consent_to_feature BOOLEAN NOT NULL DEFAULT false;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS featured BOOLEAN NOT NULL DEFAULT false;

      CREATE TABLE IF NOT EXISTS resumes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'Untitled Resume',
        template TEXT NOT NULL DEFAULT 'classic',
        data JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

      CREATE INDEX IF NOT EXISTS idx_resumes_user ON resumes(user_id);
    `).then(() => undefined);
  }
  return schemaReady;
}

export type UserRow = {
  id: string;
  email: string;
  password_hash: string;
  name: string | null;
  plan: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  pdf_download_count: number;
  ai_writing_assist_count: number;
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  email_verified: boolean;
  email_verification_token: string | null;
  email_verification_expiry: string | null;
  password_reset_token: string | null;
  password_reset_expiry: string | null;
  country_code: string | null;
  pricing_tier: string | null;
  created_at: string;
};

export type ResumeRow = {
  id: string;
  user_id: string;
  title: string;
  template: string;
  data: string; // JSON string, to keep the same shape callers already expect
  created_at: string;
  updated_at: string;
};

export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
  return res.rows[0];
}

export async function getUserById(id: string): Promise<UserRow | undefined> {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
  return res.rows[0];
}

export async function createUser(u: {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  emailVerified?: boolean;
  countryCode?: string;
  pricingTier?: string;
}) {
  await ensureSchema();
  await pool.query(
    "INSERT INTO users (id, email, password_hash, name, email_verified, country_code, pricing_tier) VALUES ($1, $2, $3, $4, $5, $6, $7)",
    [u.id, u.email, u.passwordHash, u.name ?? null, u.emailVerified ?? false, u.countryCode ?? null, u.pricingTier ?? null]
  );
}

export async function listResumesForUser(userId: string): Promise<ResumeRow[]> {
  await ensureSchema();
  const res = await pool.query(
    "SELECT id, user_id, title, template, data::text as data, created_at, updated_at FROM resumes WHERE user_id = $1 ORDER BY updated_at DESC",
    [userId]
  );
  return res.rows;
}

export async function getResume(id: string, userId: string): Promise<ResumeRow | undefined> {
  await ensureSchema();
  const res = await pool.query(
    "SELECT id, user_id, title, template, data::text as data, created_at, updated_at FROM resumes WHERE id = $1 AND user_id = $2",
    [id, userId]
  );
  return res.rows[0];
}

export async function upsertResume(r: { id: string; userId: string; title: string; template: string; data: string }) {
  await ensureSchema();
  await pool.query(
    `INSERT INTO resumes (id, user_id, title, template, data)
     VALUES ($1, $2, $3, $4, $5::jsonb)
     ON CONFLICT (id) DO UPDATE
     SET title = EXCLUDED.title, template = EXCLUDED.template, data = EXCLUDED.data, updated_at = now()`,
    [r.id, r.userId, r.title, r.template, r.data]
  );
}

export async function deleteResume(id: string, userId: string) {
  await ensureSchema();
  await pool.query("DELETE FROM resumes WHERE id = $1 AND user_id = $2", [id, userId]);
}

export async function countResumesForUser(userId: string): Promise<number> {
  await ensureSchema();
  const res = await pool.query("SELECT COUNT(*)::int AS count FROM resumes WHERE user_id = $1", [userId]);
  return res.rows[0].count;
}

export async function getUserByStripeCustomerId(customerId: string): Promise<UserRow | undefined> {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM users WHERE stripe_customer_id = $1", [customerId]);
  return res.rows[0];
}

/**
 * Saves a user's country + pricing tier only if none was saved yet - for
 * accounts created via Google/LinkedIn (no request headers at signup) or
 * before regional pricing existed. Never overwrites an existing value, so a
 * user's price stays stable once set. Returns the updated row, or undefined
 * if the user already had a country saved.
 */
export async function setUserRegionIfMissing(
  userId: string,
  countryCode: string,
  pricingTier: string
): Promise<UserRow | undefined> {
  await ensureSchema();
  const { rows } = await pool.query(
    "UPDATE users SET country_code = $2, pricing_tier = $3 WHERE id = $1 AND country_code IS NULL RETURNING *",
    [userId, countryCode, pricingTier]
  );
  return rows[0];
}

export async function setStripeCustomerId(userId: string, customerId: string) {
  await ensureSchema();
  await pool.query("UPDATE users SET stripe_customer_id = $1 WHERE id = $2", [customerId, userId]);
}

export async function updateUserPlan(params: {
  userId: string;
  plan: "free" | "pro";
  stripeSubscriptionId?: string | null;
}) {
  await ensureSchema();
  await pool.query(
    "UPDATE users SET plan = $1, stripe_subscription_id = $2 WHERE id = $3",
    [params.plan, params.stripeSubscriptionId ?? null, params.userId]
  );
}

export async function incrementPdfDownloadCount(userId: string): Promise<number> {
  await ensureSchema();
  const res = await pool.query(
    "UPDATE users SET pdf_download_count = pdf_download_count + 1 WHERE id = $1 RETURNING pdf_download_count",
    [userId]
  );
  return res.rows[0].pdf_download_count;
}

/**
 * Free-tier AI writing assist (bullet rewrite + summary generation) is
 * capped at a LIFETIME total, not the usual per-10-minute rate limit -
 * this is a separate mechanism from lib/rate-limit.ts, which protects
 * against rapid abuse but resets forever and doesn't bound total cost.
 * This bounds a free user's worst-case AI cost to a small, fixed, one-time
 * amount rather than an unbounded ongoing one.
 */
export async function incrementAiWritingAssistCount(userId: string): Promise<number> {
  await ensureSchema();
  const res = await pool.query(
    "UPDATE users SET ai_writing_assist_count = ai_writing_assist_count + 1 WHERE id = $1 RETURNING ai_writing_assist_count",
    [userId]
  );
  return res.rows[0].ai_writing_assist_count;
}

export async function setGoogleTokens(params: {
  userId: string;
  accessToken: string;
  refreshToken?: string | null;
  expiryDate: Date;
}) {
  await ensureSchema();
  if (params.refreshToken) {
    await pool.query(
      "UPDATE users SET google_access_token = $1, google_refresh_token = $2, google_token_expiry = $3 WHERE id = $4",
      [params.accessToken, params.refreshToken, params.expiryDate.toISOString(), params.userId]
    );
  } else {
    // Google only returns a refresh_token on the FIRST consent - subsequent
    // token refreshes must not overwrite the existing one with null.
    await pool.query(
      "UPDATE users SET google_access_token = $1, google_token_expiry = $2 WHERE id = $3",
      [params.accessToken, params.expiryDate.toISOString(), params.userId]
    );
  }
}

export type SupportMessageRow = {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

export async function createSupportMessage(params: {
  id: string;
  userId: string | null;
  email: string;
  subject: string;
  message: string;
}) {
  await ensureSchema();
  await pool.query(
    "INSERT INTO support_messages (id, user_id, email, subject, message) VALUES ($1, $2, $3, $4, $5)",
    [params.id, params.userId, params.email, params.subject, params.message]
  );
}

export async function listSupportMessages(): Promise<SupportMessageRow[]> {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM support_messages ORDER BY created_at DESC");
  return res.rows;
}

export async function updateSupportMessageStatus(id: string, status: "open" | "resolved") {
  await ensureSchema();
  await pool.query("UPDATE support_messages SET status = $1 WHERE id = $2", [status, id]);
}

export type AdminOverview = {
  totalUsers: number;
  /** All Pro accounts: paid through Stripe + given Pro by an admin. */
  proUsers: number;
  /** Pro with a real Stripe subscription - the only ones that bring in money. */
  paidProUsers: number;
  /** Pro given by an admin (no Stripe subscription) - free to them, no revenue. */
  compedProUsers: number;
  freeUsers: number;
  totalResumes: number;
  openSupportCount: number;
  signupsByWeek: { week: string; count: number }[];
  signupsLast30Days: number;
  activeUsers7Days: number;
  activeUsers30Days: number;
  pdfDownloadsTotal: number;
  aiRewritesTotal: number;
};

/**
 * Platform-wide numbers for the admin portal. Pass the admin's own email to
 * leave that account out, so the owner's testing doesn't inflate user,
 * Pro or conversion figures.
 */
export async function getAdminOverview(excludeEmail?: string | null): Promise<AdminOverview> {
  await ensureSchema();
  const ex = excludeEmail?.trim().toLowerCase() || null;
  // Every query filters users through this, so the admin account is
  // excluded consistently (or nothing is, when ex is null).
  const userFilter = "($1::text IS NULL OR lower(u.email) <> $1)";

  const [userCounts, resumeCount, supportCount, weeklySignups, activity] = await Promise.all([
    pool.query(
      `SELECT COUNT(*)::int AS total,
              COUNT(*) FILTER (WHERE plan = 'pro')::int AS pro,
              COUNT(*) FILTER (WHERE plan = 'pro' AND stripe_subscription_id IS NOT NULL)::int AS paid,
              COUNT(*) FILTER (WHERE plan = 'free')::int AS free,
              COUNT(*) FILTER (WHERE created_at > now() - interval '30 days')::int AS signups30,
              COALESCE(SUM(pdf_download_count), 0)::int AS pdfs,
              COALESCE(SUM(ai_writing_assist_count), 0)::int AS ai
       FROM users u WHERE ${userFilter}`,
      [ex]
    ),
    pool.query(`SELECT COUNT(*)::int AS count FROM resumes r JOIN users u ON u.id = r.user_id WHERE ${userFilter}`, [ex]),
    pool.query("SELECT COUNT(*)::int AS count FROM support_messages WHERE status = 'open'"),
    pool.query(
      `SELECT to_char(date_trunc('week', created_at), 'YYYY-MM-DD') AS week, COUNT(*)::int AS count
       FROM users u
       WHERE created_at > now() - interval '12 weeks' AND ${userFilter}
       GROUP BY 1
       ORDER BY 1 ASC`,
      [ex]
    ),
    pool.query(
      `SELECT COUNT(DISTINCT a.user_id) FILTER (WHERE a.created_at > now() - interval '7 days')::int AS active7,
              COUNT(DISTINCT a.user_id) FILTER (WHERE a.created_at > now() - interval '30 days')::int AS active30
       FROM activity_log a JOIN users u ON u.id = a.user_id WHERE ${userFilter}`,
      [ex]
    ),
  ]);

  const c = userCounts.rows[0];
  return {
    totalUsers: c.total,
    proUsers: c.pro,
    paidProUsers: c.paid,
    compedProUsers: c.pro - c.paid,
    freeUsers: c.free,
    totalResumes: resumeCount.rows[0].count,
    openSupportCount: supportCount.rows[0].count,
    signupsByWeek: weeklySignups.rows,
    signupsLast30Days: c.signups30,
    activeUsers7Days: activity.rows[0].active7,
    activeUsers30Days: activity.rows[0].active30,
    pdfDownloadsTotal: c.pdfs,
    aiRewritesTotal: c.ai,
  };
}

export type RecentUserRow = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  created_at: string;
  stripe_subscription_id: string | null;
};

export async function listRecentUsers(limit = 6): Promise<RecentUserRow[]> {
  await ensureSchema();
  const res = await pool.query(
    "SELECT id, email, name, plan, created_at, stripe_subscription_id FROM users ORDER BY created_at DESC LIMIT $1",
    [limit]
  );
  return res.rows;
}

export type ActivityRow = { id: string; user_id: string; action: string; detail: string | null; created_at: string };

export async function logActivity(userId: string, action: string, detail?: string) {
  await ensureSchema();
  await pool.query(
    "INSERT INTO activity_log (id, user_id, action, detail) VALUES ($1, $2, $3, $4)",
    [randomUUID(), userId, action, detail ?? null]
  );
}

export async function listRecentActivity(userId: string, limit = 5): Promise<ActivityRow[]> {
  await ensureSchema();
  const res = await pool.query(
    "SELECT * FROM activity_log WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2",
    [userId, limit]
  );
  return res.rows;
}

export type AdminUserRow = {
  id: string;
  email: string;
  name: string | null;
  plan: string;
  created_at: string;
  resume_count: number;
  country_code: string | null;
  pricing_tier: string | null;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  pdf_download_count: number;
  ai_writing_assist_count: number;
  /** Most recent recorded activity (resume created, export, AI use...), if any. */
  last_active: string | null;
};

export async function listAllUsers(search?: string): Promise<AdminUserRow[]> {
  await ensureSchema();
  const res = await pool.query(
    `SELECT u.id, u.email, u.name, u.plan, u.created_at, u.country_code, u.pricing_tier,
            u.stripe_subscription_id, u.stripe_customer_id, u.pdf_download_count, u.ai_writing_assist_count,
            (SELECT COUNT(*)::int FROM resumes r WHERE r.user_id = u.id) AS resume_count,
            (SELECT MAX(a.created_at) FROM activity_log a WHERE a.user_id = u.id) AS last_active
     FROM users u
     WHERE ($1::text IS NULL OR u.email ILIKE '%' || $1 || '%' OR u.name ILIKE '%' || $1 || '%')
     ORDER BY u.created_at DESC`,
    [search || null]
  );
  return res.rows;
}

export async function getTemplatePopularity(): Promise<{ template: string; count: number }[]> {
  await ensureSchema();
  const res = await pool.query(
    "SELECT template, COUNT(*)::int AS count FROM resumes GROUP BY template ORDER BY count DESC"
  );
  return res.rows;
}

export async function countRecentRateLimitEvents(
  userId: string,
  endpoint: string,
  windowStart: Date
): Promise<{ count: number; oldest: string | null }> {
  await ensureSchema();
  const res = await pool.query(
    "SELECT COUNT(*)::int AS count, MIN(created_at) AS oldest FROM rate_limit_events WHERE user_id = $1 AND endpoint = $2 AND created_at > $3",
    [userId, endpoint, windowStart.toISOString()]
  );
  return res.rows[0];
}

export async function recordRateLimitEvent(userId: string, endpoint: string) {
  await ensureSchema();
  await pool.query(
    "INSERT INTO rate_limit_events (id, user_id, endpoint) VALUES ($1, $2, $3)",
    [randomUUID(), userId, endpoint]
  );
}

export async function setEmailVerificationToken(userId: string, token: string, expiry: Date) {
  await ensureSchema();
  await pool.query(
    "UPDATE users SET email_verification_token = $1, email_verification_expiry = $2 WHERE id = $3",
    [token, expiry.toISOString(), userId]
  );
}

export async function verifyEmailByToken(token: string): Promise<UserRow | undefined> {
  await ensureSchema();
  const res = await pool.query(
    "UPDATE users SET email_verified = true, email_verification_token = NULL, email_verification_expiry = NULL WHERE email_verification_token = $1 AND email_verification_expiry > now() RETURNING *",
    [token]
  );
  return res.rows[0];
}

export async function setPasswordResetToken(userId: string, token: string, expiry: Date) {
  await ensureSchema();
  await pool.query(
    "UPDATE users SET password_reset_token = $1, password_reset_expiry = $2 WHERE id = $3",
    [token, expiry.toISOString(), userId]
  );
}

export async function getUserByPasswordResetToken(token: string): Promise<UserRow | undefined> {
  await ensureSchema();
  const res = await pool.query(
    "SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expiry > now()",
    [token]
  );
  return res.rows[0];
}

export async function resetPassword(userId: string, newPasswordHash: string) {
  await ensureSchema();
  await pool.query(
    "UPDATE users SET password_hash = $1, password_reset_token = NULL, password_reset_expiry = NULL WHERE id = $2",
    [newPasswordHash, userId]
  );
}

export type AdminAuditRow = {
  id: string;
  admin_user_id: string;
  action: string;
  target_user_id: string | null;
  detail: string | null;
  created_at: string;
};

export async function logAdminAction(params: {
  adminUserId: string;
  action: string;
  targetUserId?: string;
  detail?: string;
}) {
  await ensureSchema();
  await pool.query(
    "INSERT INTO admin_audit_log (id, admin_user_id, action, target_user_id, detail) VALUES ($1, $2, $3, $4, $5)",
    [randomUUID(), params.adminUserId, params.action, params.targetUserId ?? null, params.detail ?? null]
  );
}

export async function listAdminAuditLog(limit = 50): Promise<AdminAuditRow[]> {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT $1", [limit]);
  return res.rows;
}

/**
 * Deletes a user account entirely. Their resumes and activity log rows
 * cascade-delete automatically via foreign key ON DELETE CASCADE; support
 * messages are preserved but disassociated (ON DELETE SET NULL), so past
 * support history isn't silently erased.
 */
export async function deleteUserAccount(userId: string) {
  await ensureSchema();
  await pool.query("DELETE FROM users WHERE id = $1", [userId]);
}

export type ReviewRow = {
  id: string;
  user_id: string;
  rating: number;
  content: string;
  sentiment: string | null;
  likes: string[];
  dislikes: string[];
  ai_reply: string | null;
  consent_to_feature: boolean;
  featured: boolean;
  created_at: string;
};

export async function createReview(params: {
  id: string;
  userId: string;
  rating: number;
  content: string;
  sentiment: string;
  likes: string[];
  dislikes: string[];
  aiReply: string;
  consentToFeature: boolean;
}) {
  await ensureSchema();
  await pool.query(
    `INSERT INTO reviews (id, user_id, rating, content, sentiment, likes, dislikes, ai_reply, consent_to_feature)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9)`,
    [
      params.id,
      params.userId,
      params.rating,
      params.content,
      params.sentiment,
      JSON.stringify(params.likes),
      JSON.stringify(params.dislikes),
      params.aiReply,
      params.consentToFeature,
    ]
  );
}

/**
 * Sets whether a review is featured on the public landing page. Only
 * allowed if the reviewer actually consented to being featured - enforced
 * here (not just in the UI) so a bug in the admin page can't accidentally
 * publish someone's feedback without their consent.
 */
export async function setReviewFeatured(reviewId: string, featured: boolean): Promise<{ ok: boolean; reason?: string }> {
  await ensureSchema();
  if (featured) {
    const check = await pool.query("SELECT consent_to_feature FROM reviews WHERE id = $1", [reviewId]);
    if (!check.rows[0]?.consent_to_feature) {
      return { ok: false, reason: "This reviewer did not consent to being featured publicly." };
    }
  }
  await pool.query("UPDATE reviews SET featured = $1 WHERE id = $2", [featured, reviewId]);
  return { ok: true };
}

/** Real reviews eligible for the public landing page - both consented AND admin-approved. */
export async function getFeaturedReviews(limit = 6): Promise<ReviewWithUser[]> {
  await ensureSchema();
  const res = await pool.query(
    `SELECT r.*, u.email AS user_email, u.name AS user_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     WHERE r.featured = true AND r.consent_to_feature = true
     ORDER BY r.rating DESC, r.created_at DESC
     LIMIT $1`,
    [limit]
  );
  return res.rows;
}

export type ReviewWithUser = ReviewRow & { user_email: string; user_name: string | null };

/** A user's own past feedback, newest first - shown back to them on the Feedback page. */
export async function listReviewsForUser(userId: string, limit = 10): Promise<ReviewRow[]> {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM reviews WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2", [userId, limit]);
  return res.rows;
}

export async function listAllReviews(limit = 100): Promise<ReviewWithUser[]> {
  await ensureSchema();
  const res = await pool.query(
    `SELECT r.*, u.email AS user_email, u.name AS user_name
     FROM reviews r JOIN users u ON u.id = r.user_id
     ORDER BY r.created_at DESC LIMIT $1`,
    [limit]
  );
  return res.rows;
}

export async function getReviewStats(): Promise<{ total: number; avgRating: number; distribution: Record<number, number> }> {
  await ensureSchema();
  const res = await pool.query("SELECT rating, COUNT(*)::int AS count FROM reviews GROUP BY rating");
  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let total = 0;
  let ratingSum = 0;
  for (const row of res.rows) {
    distribution[row.rating] = row.count;
    total += row.count;
    ratingSum += row.rating * row.count;
  }
  return { total, avgRating: total === 0 ? 0 : Math.round((ratingSum / total) * 10) / 10, distribution };
}

export async function markEmailVerified(userId: string) {
  await ensureSchema();
  await pool.query(
    "UPDATE users SET email_verified = true, email_verification_token = NULL, email_verification_expiry = NULL WHERE id = $1",
    [userId]
  );
}

export default pool;
