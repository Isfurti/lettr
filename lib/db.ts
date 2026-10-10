import { Pool } from "pg";
import { randomUUID } from "node:crypto";
import type { ApplicationStatus } from "./application-status";

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

      -- GST invoices. Kept after an account is deleted (tax records), so the
      -- buyer details are copied onto the invoice instead of joined.
      CREATE TABLE IF NOT EXISTS invoice_counters (
        financial_year TEXT PRIMARY KEY,
        last_serial INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        number TEXT NOT NULL UNIQUE,
        financial_year TEXT NOT NULL,
        serial INTEGER NOT NULL,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        buyer_name TEXT,
        buyer_email TEXT NOT NULL,
        buyer_gstin TEXT,
        buyer_state_code TEXT,
        buyer_country TEXT NOT NULL DEFAULT 'IN',
        description TEXT NOT NULL,
        sac TEXT NOT NULL,
        seller_gstin TEXT NOT NULL,
        currency TEXT NOT NULL,
        total INTEGER NOT NULL,
        taxable INTEGER NOT NULL,
        cgst INTEGER NOT NULL DEFAULT 0,
        sgst INTEGER NOT NULL DEFAULT 0,
        igst INTEGER NOT NULL DEFAULT 0,
        tax_type TEXT NOT NULL,
        payment_ref TEXT UNIQUE
      );
      CREATE INDEX IF NOT EXISTS idx_invoices_user ON invoices(user_id);
      CREATE INDEX IF NOT EXISTS idx_invoices_issued ON invoices(issued_at);

      -- One row per AI request: which feature, which model, how many tokens,
      -- and whether it was answered from the reuse cache or the batch API.
      -- Runs the monthly fair-use caps and the admin AI cost view. Rows stay
      -- (without the user) after an account is deleted, as anonymous totals.
      CREATE TABLE IF NOT EXISTS ai_usage_events (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        feature TEXT NOT NULL,
        model TEXT NOT NULL,
        input_tokens INTEGER NOT NULL DEFAULT 0,
        output_tokens INTEGER NOT NULL DEFAULT 0,
        cache_read_tokens INTEGER NOT NULL DEFAULT 0,
        cache_write_tokens INTEGER NOT NULL DEFAULT 0,
        reused BOOLEAN NOT NULL DEFAULT false,
        batch BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_usage_user_feature ON ai_usage_events(user_id, feature, created_at);
      CREATE INDEX IF NOT EXISTS idx_ai_usage_created ON ai_usage_events(created_at);

      -- Free plan: each AI feature once per person. One row per use, matched
      -- on the account, a one-way code of the (normalised) email and a random
      -- browser code, so a new account doesn't get a new allowance. Rows stay,
      -- without the user, after an account is deleted.
      CREATE TABLE IF NOT EXISTS free_uses (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        email_hash TEXT,
        device_id TEXT,
        feature TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_free_uses_user ON free_uses(user_id, feature);
      CREATE INDEX IF NOT EXISTS idx_free_uses_email ON free_uses(email_hash, feature);
      CREATE INDEX IF NOT EXISTS idx_free_uses_device ON free_uses(device_id, feature);

      -- Saved AI results, so asking again with the same resume and job post
      -- is instant and free. Per user, deleted with the account, 30 days max.
      CREATE TABLE IF NOT EXISTS ai_result_cache (
        key TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        feature TEXT NOT NULL,
        result JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_result_cache_created ON ai_result_cache(created_at);

      -- Job applications tracker (dashboard -> Applications).
      CREATE TABLE IF NOT EXISTS job_applications (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        company TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT '',
        url TEXT,
        location TEXT,
        status TEXT NOT NULL DEFAULT 'saved',
        applied_on DATE,
        next_step TEXT,
        next_step_on DATE,
        notes TEXT,
        job_post TEXT,
        resume_id TEXT REFERENCES resumes(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_job_applications_user ON job_applications(user_id, updated_at DESC);

      -- Interview practice answers and the AI's feedback.
      CREATE TABLE IF NOT EXISTS interview_sessions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        company TEXT,
        questions JSONB NOT NULL DEFAULT '[]',
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_interview_sessions_user ON interview_sessions(user_id, updated_at DESC);

      -- AI learning loop: was each AI suggestion kept, edited or rejected?
      -- Text is only stored for users who opted in, with personal details removed.
      ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_improvement_consent BOOLEAN NOT NULL DEFAULT false;
      CREATE TABLE IF NOT EXISTS ai_feedback_events (
        id BIGSERIAL PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        feature TEXT NOT NULL,
        action TEXT NOT NULL,
        input_text TEXT,
        suggestion_text TEXT,
        final_text TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_ai_feedback_created ON ai_feedback_events(created_at);

      -- Replies to 1-2 star reviews wait for a person to approve them.
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply_held BOOLEAN NOT NULL DEFAULT false;

      -- Review analysis can run through the cheaper batch API.
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS analysis_status TEXT NOT NULL DEFAULT 'done';
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS analysis_batch_id TEXT;
      ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply_emailed BOOLEAN NOT NULL DEFAULT false;
      CREATE INDEX IF NOT EXISTS idx_reviews_analysis ON reviews(analysis_status) WHERE analysis_status <> 'done';
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
  ai_improvement_consent: boolean;
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
  // The longest rate-limit window is one day, so older rows serve no purpose.
  // Prune now and then (about 1 call in 50) - the privacy policy promises
  // hashed visitor keys are only kept for a few days.
  if (Math.random() < 0.02) {
    await pool.query("DELETE FROM rate_limit_events WHERE created_at < now() - interval '3 days'");
  }
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
  // Any AI-improvement examples go too, not just the link to the user.
  await pool.query(
    "UPDATE ai_feedback_events SET input_text = NULL, suggestion_text = NULL, final_text = NULL WHERE user_id = $1",
    [userId]
  );
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
  analysis_status: "pending" | "submitted" | "done" | "failed";
  analysis_batch_id: string | null;
  reply_emailed: boolean;
  reply_held: boolean;
  created_at: string;
};

export async function createReview(params: {
  id: string;
  userId: string;
  rating: number;
  content: string;
  consentToFeature: boolean;
  /** Leave the analysis out to queue the review for the batch job. */
  sentiment?: string;
  likes?: string[];
  dislikes?: string[];
  aiReply?: string;
  replyEmailed?: boolean;
  replyHeld?: boolean;
}) {
  await ensureSchema();
  const analysed = typeof params.aiReply === "string";
  await pool.query(
    `INSERT INTO reviews (id, user_id, rating, content, sentiment, likes, dislikes, ai_reply, consent_to_feature, analysis_status, reply_emailed, reply_held)
     VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9, $10, $11, $12)`,
    [
      params.id,
      params.userId,
      params.rating,
      params.content,
      params.sentiment ?? null,
      JSON.stringify(params.likes ?? []),
      JSON.stringify(params.dislikes ?? []),
      params.aiReply ?? null,
      params.consentToFeature,
      analysed ? "done" : "pending",
      params.replyEmailed ?? false,
      params.replyHeld ?? false,
    ]
  );
}

/** Reviews waiting for the batch job: not yet sent, or sent and waiting for results. */
export async function listReviewsAwaitingAnalysis(limit = 200): Promise<(ReviewRow & { user_email: string | null })[]> {
  await ensureSchema();
  const res = await pool.query(
    `SELECT r.*, u.email AS user_email FROM reviews r LEFT JOIN users u ON u.id = r.user_id
     WHERE r.analysis_status IN ('pending', 'submitted') ORDER BY r.created_at LIMIT $1`,
    [limit]
  );
  return res.rows;
}

export async function markReviewsSubmitted(ids: string[], batchId: string) {
  if (ids.length === 0) return;
  await ensureSchema();
  await pool.query("UPDATE reviews SET analysis_status = 'submitted', analysis_batch_id = $1 WHERE id = ANY($2)", [batchId, ids]);
}

export async function saveReviewAnalysis(
  id: string,
  a: { sentiment: string; likes: string[]; dislikes: string[]; aiReply: string; replyEmailed: boolean; replyHeld?: boolean }
) {
  await ensureSchema();
  await pool.query(
    `UPDATE reviews SET sentiment = $2, likes = $3::jsonb, dislikes = $4::jsonb, ai_reply = $5,
       reply_emailed = $6, reply_held = $7, analysis_status = 'done' WHERE id = $1`,
    [id, a.sentiment, JSON.stringify(a.likes), JSON.stringify(a.dislikes), a.aiReply, a.replyEmailed, a.replyHeld ?? false]
  );
}

/** An admin approved (and maybe edited) a held reply: store it and mark it sent or not. */
export async function approveReviewReply(id: string, reply: string, emailed: boolean) {
  await ensureSchema();
  await pool.query("UPDATE reviews SET ai_reply = $2, reply_held = false, reply_emailed = $3 WHERE id = $1", [id, reply, emailed]);
}

export async function getReviewWithEmail(id: string): Promise<(ReviewRow & { user_email: string | null }) | undefined> {
  await ensureSchema();
  const res = await pool.query("SELECT r.*, u.email AS user_email FROM reviews r LEFT JOIN users u ON u.id = r.user_id WHERE r.id = $1", [id]);
  return res.rows[0];
}

/** A failed or expired batch request goes back in the queue (up to the caller to give up). */
export async function setReviewAnalysisStatus(id: string, status: "pending" | "failed") {
  await ensureSchema();
  await pool.query("UPDATE reviews SET analysis_status = $2, analysis_batch_id = NULL WHERE id = $1", [id, status]);
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


// ---------- GST invoices ----------

export type InvoiceRow = {
  id: string;
  number: string;
  financial_year: string;
  serial: number;
  user_id: string | null;
  issued_at: string;
  buyer_name: string | null;
  buyer_email: string;
  buyer_gstin: string | null;
  buyer_state_code: string | null;
  buyer_country: string;
  description: string;
  sac: string;
  seller_gstin: string;
  currency: string;
  total: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax_type: string;
  payment_ref: string | null;
};

export type NewInvoice = Omit<InvoiceRow, "id" | "number" | "serial" | "issued_at"> & { issuedAt?: Date };

/**
 * Saves an invoice with the next serial number for its financial year.
 * The counter row is locked inside a transaction so two payments at the same
 * moment can never get the same number. If an invoice already exists for the
 * same payment reference, that one is returned instead (webhooks can repeat).
 */
export async function createInvoiceRecord(
  inv: NewInvoice,
  formatNumber: (fy: string, serial: number) => string
): Promise<InvoiceRow> {
  await ensureSchema();
  if (inv.payment_ref) {
    const existing = await pool.query("SELECT * FROM invoices WHERE payment_ref = $1", [inv.payment_ref]);
    if (existing.rows[0]) return existing.rows[0];
  }
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "INSERT INTO invoice_counters (financial_year, last_serial) VALUES ($1, 0) ON CONFLICT (financial_year) DO NOTHING",
      [inv.financial_year]
    );
    const counter = await client.query(
      "UPDATE invoice_counters SET last_serial = last_serial + 1 WHERE financial_year = $1 RETURNING last_serial",
      [inv.financial_year]
    );
    const serial: number = counter.rows[0].last_serial;
    const res = await client.query(
      `INSERT INTO invoices (id, number, financial_year, serial, user_id, issued_at, buyer_name, buyer_email, buyer_gstin,
         buyer_state_code, buyer_country, description, sac, seller_gstin, currency, total, taxable, cgst, sgst, igst,
         tax_type, payment_ref)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22)
       RETURNING *`,
      [
        randomUUID(), formatNumber(inv.financial_year, serial), inv.financial_year, serial, inv.user_id,
        inv.issuedAt ?? new Date(), inv.buyer_name, inv.buyer_email, inv.buyer_gstin, inv.buyer_state_code,
        inv.buyer_country, inv.description, inv.sac, inv.seller_gstin, inv.currency, inv.total, inv.taxable,
        inv.cgst, inv.sgst, inv.igst, inv.tax_type, inv.payment_ref,
      ]
    );
    await client.query("COMMIT");
    return res.rows[0];
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function listInvoicesForUser(userId: string): Promise<InvoiceRow[]> {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM invoices WHERE user_id = $1 ORDER BY issued_at DESC", [userId]);
  return res.rows;
}

export async function getInvoiceById(id: string): Promise<InvoiceRow | undefined> {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM invoices WHERE id = $1", [id]);
  return res.rows[0];
}

/** All invoices, newest first; optionally only those issued in a calendar month ("2026-10"), in India time. */
export async function listInvoices(month?: string): Promise<InvoiceRow[]> {
  await ensureSchema();
  if (month && /^\d{4}-\d{2}$/.test(month)) {
    const res = await pool.query(
      `SELECT * FROM invoices
       WHERE to_char(issued_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM') = $1
       ORDER BY issued_at ASC`,
      [month]
    );
    return res.rows;
  }
  const res = await pool.query("SELECT * FROM invoices ORDER BY issued_at DESC LIMIT 500");
  return res.rows;
}

// ---------- AI usage, fair use and reuse ----------

export type AiUsageEvent = {
  userId: string | null;
  feature: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  reused?: boolean;
  batch?: boolean;
};

export async function recordAiUsage(e: AiUsageEvent) {
  await ensureSchema();
  await pool.query(
    `INSERT INTO ai_usage_events (user_id, feature, model, input_tokens, output_tokens, cache_read_tokens, cache_write_tokens, reused, batch)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      e.userId,
      e.feature,
      e.model,
      e.inputTokens ?? 0,
      e.outputTokens ?? 0,
      e.cacheReadTokens ?? 0,
      e.cacheWriteTokens ?? 0,
      e.reused ?? false,
      e.batch ?? false,
    ]
  );
  // Totals older than 13 months aren't needed for anything.
  if (Math.random() < 0.01) {
    await pool.query("DELETE FROM ai_usage_events WHERE created_at < now() - interval '13 months'");
  }
}

/** How many times a user used a feature since `since`, not counting answers reused from the cache. */
export async function countAiUses(userId: string, feature: string, since: Date): Promise<number> {
  await ensureSchema();
  const res = await pool.query(
    "SELECT COUNT(*)::int AS n FROM ai_usage_events WHERE user_id = $1 AND feature = $2 AND created_at >= $3 AND reused = false",
    [userId, feature, since.toISOString()]
  );
  return res.rows[0].n;
}

/** AI requests by a user since `since` across several features (null = every feature except review replies). Cached answers don't count. */
export async function countAiUsesAny(userId: string, features: string[] | null, since: Date): Promise<number> {
  await ensureSchema();
  const res = await pool.query(
    `SELECT COUNT(*)::int AS n FROM ai_usage_events
      WHERE user_id = $1 AND created_at >= $2 AND reused = false
        AND ($3::text[] IS NULL OR feature = ANY($3)) AND feature <> 'review'`,
    [userId, since.toISOString(), features]
  );
  return res.rows[0].n;
}

export type FreeUseWho = { userId: string; emailHash: string | null; deviceId: string | null };

/** Free-plan uses of a feature by this person: same account, same email or same browser. */
export async function countFreeUses(who: FreeUseWho, features: string[]): Promise<number> {
  await ensureSchema();
  const res = await pool.query(
    `SELECT COUNT(*)::int AS n FROM free_uses
      WHERE feature = ANY($1)
        AND (user_id = $2 OR ($3::text IS NOT NULL AND email_hash = $3) OR ($4::text IS NOT NULL AND device_id = $4))`,
    [features, who.userId, who.emailHash, who.deviceId]
  );
  return res.rows[0].n;
}

export async function recordFreeUse(who: FreeUseWho, feature: string) {
  await ensureSchema();
  await pool.query("INSERT INTO free_uses (user_id, email_hash, device_id, feature) VALUES ($1, $2, $3, $4)", [
    who.userId,
    who.emailHash,
    who.deviceId,
    feature,
  ]);
}

export type AiUsageSummaryRow = {
  feature: string;
  model: string;
  calls: number;
  reused: number;
  batched: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
};

/** Totals per feature and model since a date, for the admin cost view. */
export async function getAiUsageSummary(since: Date): Promise<AiUsageSummaryRow[]> {
  await ensureSchema();
  const res = await pool.query(
    `SELECT feature, model, COUNT(*)::int AS calls,
       COUNT(*) FILTER (WHERE reused)::int AS reused,
       COUNT(*) FILTER (WHERE batch)::int AS batched,
       COALESCE(SUM(input_tokens), 0)::int AS input_tokens,
       COALESCE(SUM(output_tokens), 0)::int AS output_tokens,
       COALESCE(SUM(cache_read_tokens), 0)::int AS cache_read_tokens,
       COALESCE(SUM(cache_write_tokens), 0)::int AS cache_write_tokens
     FROM ai_usage_events WHERE created_at >= $1
     GROUP BY feature, model ORDER BY feature, model`,
    [since.toISOString()]
  );
  return res.rows;
}

const AI_RESULT_TTL_DAYS = 30;

export async function getCachedAiResult<T>(key: string, userId: string): Promise<T | null> {
  await ensureSchema();
  const res = await pool.query(
    `SELECT result FROM ai_result_cache WHERE key = $1 AND user_id = $2
       AND created_at > now() - ($3 || ' days')::interval`,
    [key, userId, String(AI_RESULT_TTL_DAYS)]
  );
  return res.rows[0] ? (res.rows[0].result as T) : null;
}

export async function saveCachedAiResult(key: string, userId: string, feature: string, result: unknown) {
  await ensureSchema();
  await pool.query(
    `INSERT INTO ai_result_cache (key, user_id, feature, result) VALUES ($1, $2, $3, $4::jsonb)
     ON CONFLICT (key) DO UPDATE SET result = EXCLUDED.result, created_at = now()`,
    [key, userId, feature, JSON.stringify(result)]
  );
  if (Math.random() < 0.02) {
    await pool.query("DELETE FROM ai_result_cache WHERE created_at < now() - ($1 || ' days')::interval", [String(AI_RESULT_TTL_DAYS)]);
  }
}

// ---------- Job applications ----------

export type { ApplicationStatus };

export type ApplicationRow = {
  id: string;
  user_id: string;
  company: string;
  role: string;
  url: string | null;
  location: string | null;
  status: ApplicationStatus;
  applied_on: string | null;
  next_step: string | null;
  next_step_on: string | null;
  notes: string | null;
  job_post: string | null;
  resume_id: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicationInput = {
  company: string;
  role?: string;
  url?: string | null;
  location?: string | null;
  status?: ApplicationStatus;
  appliedOn?: string | null;
  nextStep?: string | null;
  nextStepOn?: string | null;
  notes?: string | null;
  jobPost?: string | null;
  resumeId?: string | null;
};

// DATE columns come back as plain "YYYY-MM-DD" strings, not JS dates.
const APP_COLUMNS = `id, user_id, company, role, url, location, status,
  to_char(applied_on, 'YYYY-MM-DD') AS applied_on, next_step,
  to_char(next_step_on, 'YYYY-MM-DD') AS next_step_on, notes, job_post, resume_id, created_at, updated_at`;

export async function listApplications(userId: string): Promise<ApplicationRow[]> {
  await ensureSchema();
  const res = await pool.query(
    `SELECT ${APP_COLUMNS} FROM job_applications WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 500`,
    [userId]
  );
  return res.rows;
}

export async function countApplications(userId: string): Promise<number> {
  await ensureSchema();
  const res = await pool.query("SELECT COUNT(*)::int AS n FROM job_applications WHERE user_id = $1", [userId]);
  return res.rows[0].n;
}

/** A resume id only counts if it belongs to the same user. */
async function ownResumeId(userId: string, resumeId: string | null | undefined): Promise<string | null> {
  if (!resumeId) return null;
  const res = await pool.query("SELECT id FROM resumes WHERE id = $1 AND user_id = $2", [resumeId, userId]);
  return res.rows[0]?.id ?? null;
}

export async function createApplication(userId: string, a: ApplicationInput): Promise<ApplicationRow> {
  await ensureSchema();
  const res = await pool.query(
    `INSERT INTO job_applications (id, user_id, company, role, url, location, status, applied_on, next_step, next_step_on, notes, job_post, resume_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) RETURNING ${APP_COLUMNS}`,
    [
      randomUUID(),
      userId,
      a.company,
      a.role ?? "",
      a.url ?? null,
      a.location ?? null,
      a.status ?? "saved",
      a.appliedOn ?? null,
      a.nextStep ?? null,
      a.nextStepOn ?? null,
      a.notes ?? null,
      a.jobPost ?? null,
      await ownResumeId(userId, a.resumeId),
    ]
  );
  return res.rows[0];
}

export async function updateApplication(userId: string, id: string, a: Partial<ApplicationInput>): Promise<ApplicationRow | null> {
  await ensureSchema();
  const cols: Record<keyof ApplicationInput, string> = {
    company: "company",
    role: "role",
    url: "url",
    location: "location",
    status: "status",
    appliedOn: "applied_on",
    nextStep: "next_step",
    nextStepOn: "next_step_on",
    notes: "notes",
    jobPost: "job_post",
    resumeId: "resume_id",
  };
  const sets: string[] = [];
  const vals: unknown[] = [id, userId];
  for (const [key, col] of Object.entries(cols) as [keyof ApplicationInput, string][]) {
    if (!(key in a)) continue;
    let v = a[key] ?? null;
    if (key === "resumeId") v = await ownResumeId(userId, v as string | null);
    vals.push(v);
    sets.push(`${col} = $${vals.length}`);
  }
  if (sets.length === 0) {
    const cur = await pool.query(`SELECT ${APP_COLUMNS} FROM job_applications WHERE id = $1 AND user_id = $2`, [id, userId]);
    return cur.rows[0] ?? null;
  }
  const res = await pool.query(
    `UPDATE job_applications SET ${sets.join(", ")}, updated_at = now() WHERE id = $1 AND user_id = $2 RETURNING ${APP_COLUMNS}`,
    vals
  );
  return res.rows[0] ?? null;
}

export async function deleteApplication(userId: string, id: string): Promise<boolean> {
  await ensureSchema();
  const res = await pool.query("DELETE FROM job_applications WHERE id = $1 AND user_id = $2", [id, userId]);
  return (res.rowCount ?? 0) > 0;
}

// ---------- Interview practice ----------

export type InterviewQuestion = {
  id: string;
  question: string;
  kind: string;
  answer?: string;
  feedback?: { score: number; strengths: string[]; improve: string[]; better: string } | null;
};

export type InterviewSessionRow = {
  id: string;
  user_id: string;
  role: string;
  company: string | null;
  questions: InterviewQuestion[];
  created_at: string;
  updated_at: string;
};

export async function createInterviewSession(userId: string, role: string, company: string | null, questions: InterviewQuestion[]): Promise<InterviewSessionRow> {
  await ensureSchema();
  const res = await pool.query(
    `INSERT INTO interview_sessions (id, user_id, role, company, questions) VALUES ($1, $2, $3, $4, $5::jsonb) RETURNING *`,
    [randomUUID(), userId, role, company, JSON.stringify(questions)]
  );
  return res.rows[0];
}

export async function getInterviewSession(userId: string, id: string): Promise<InterviewSessionRow | null> {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM interview_sessions WHERE id = $1 AND user_id = $2", [id, userId]);
  return res.rows[0] ?? null;
}

export async function listInterviewSessions(userId: string, limit = 20): Promise<InterviewSessionRow[]> {
  await ensureSchema();
  const res = await pool.query("SELECT * FROM interview_sessions WHERE user_id = $1 ORDER BY updated_at DESC LIMIT $2", [userId, limit]);
  return res.rows;
}

export async function saveInterviewQuestions(userId: string, id: string, questions: InterviewQuestion[]) {
  await ensureSchema();
  await pool.query("UPDATE interview_sessions SET questions = $3::jsonb, updated_at = now() WHERE id = $1 AND user_id = $2", [
    id,
    userId,
    JSON.stringify(questions),
  ]);
}

export async function deleteInterviewSession(userId: string, id: string) {
  await ensureSchema();
  await pool.query("DELETE FROM interview_sessions WHERE id = $1 AND user_id = $2", [id, userId]);
}

// ---------- AI learning loop ----------

export async function setAiImprovementConsent(userId: string, consent: boolean) {
  await ensureSchema();
  await pool.query("UPDATE users SET ai_improvement_consent = $2 WHERE id = $1", [userId, consent]);
}

export async function recordAiFeedback(e: {
  userId: string | null;
  feature: string;
  action: "kept" | "edited" | "rejected";
  inputText?: string | null;
  suggestionText?: string | null;
  finalText?: string | null;
}) {
  await ensureSchema();
  await pool.query(
    `INSERT INTO ai_feedback_events (user_id, feature, action, input_text, suggestion_text, final_text) VALUES ($1, $2, $3, $4, $5, $6)`,
    [e.userId, e.feature, e.action, e.inputText ?? null, e.suggestionText ?? null, e.finalText ?? null]
  );
}

export type AiFeedbackSummaryRow = { feature: string; kept: number; edited: number; rejected: number; examples: number };

export async function getAiFeedbackSummary(since: Date): Promise<AiFeedbackSummaryRow[]> {
  await ensureSchema();
  const res = await pool.query(
    `SELECT feature,
       COUNT(*) FILTER (WHERE action = 'kept')::int AS kept,
       COUNT(*) FILTER (WHERE action = 'edited')::int AS edited,
       COUNT(*) FILTER (WHERE action = 'rejected')::int AS rejected,
       COUNT(*) FILTER (WHERE suggestion_text IS NOT NULL)::int AS examples
     FROM ai_feedback_events WHERE created_at >= $1 GROUP BY feature ORDER BY feature`,
    [since.toISOString()]
  );
  return res.rows;
}

/** Turning consent off removes the examples saved from that user. */
export async function deleteAiExamplesForUser(userId: string) {
  await ensureSchema();
  await pool.query(
    "UPDATE ai_feedback_events SET input_text = NULL, suggestion_text = NULL, final_text = NULL WHERE user_id = $1",
    [userId]
  );
}
