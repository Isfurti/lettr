import { createHash } from "node:crypto";

/**
 * Database migrations, applied in order, each exactly once.
 *
 * RULES (see docs/migrations.md):
 * - Never edit or reorder a migration that has been deployed. Add a new one.
 * - Every migration must work with the PREVIOUS deployment's code too (Vercel
 *   keeps old instances and rollbacks alive). Add first, deploy, remove later.
 * - Keep them quick: they run inside a request on the first cold start after a
 *   deploy, with a lock timeout. No big backfills here.
 * - Previews must use the staging database (docs/staging.md). Until that is
 *   set up they share production, and a migration on a preview branch runs there.
 */

// Tables and columns the app needs. Every statement is safe to run again.
const BASELINE_SQL = `
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
      -- Paid Pro (one-time passes). pro_until is when the paid time runs out;
      -- NULL on a Pro plan means it was given by an admin (no end date).
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_until TIMESTAMPTZ;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_plan TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS pro_reminder_sent_for TIMESTAMPTZ;

      -- One row per Razorpay order. Marked paid once, so a payment that's
      -- confirmed by both the checkout and the webhook only adds time once.
      CREATE TABLE IF NOT EXISTS payments (
        order_id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        plan_id TEXT NOT NULL,
        months INTEGER NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'created',
        payment_id TEXT UNIQUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        paid_at TIMESTAMPTZ
      );
      CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);

      -- Auto-renewing Pro plans (Razorpay Subscriptions).
      -- Each successful charge is also a row in payments (order_id "sub_<payment id>").
      CREATE TABLE IF NOT EXISTS pro_subscriptions (
        id TEXT PRIMARY KEY,
        user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
        razorpay_plan_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        currency TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'created',
        cancel_at_cycle_end BOOLEAN NOT NULL DEFAULT false,
        current_end TIMESTAMPTZ,
        reminder_sent_for TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS idx_pro_subscriptions_user ON pro_subscriptions(user_id);
      -- Which Lettr plan it is: monthly, quarter or yearly.
      ALTER TABLE pro_subscriptions ADD COLUMN IF NOT EXISTS plan_id TEXT NOT NULL DEFAULT 'monthly';
      -- One Razorpay plan per price (e.g. USD_1900), made the first time someone picks it.
      CREATE TABLE IF NOT EXISTS razorpay_plans (
        key TEXT PRIMARY KEY,
        plan_id TEXT NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now()
      );

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
      -- Examples are now kept for everyone (personal details removed) unless
      -- the person asked support to stop; then this is true.
      ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_improvement_opt_out BOOLEAN NOT NULL DEFAULT false;
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
`;

export type Migration = { id: string; sql: string };

export const MIGRATIONS: Migration[] = [
  // The schema as it was when migrations were introduced. Every statement is
  // safe to run again, so it is harmless on the live database; there it is
  // recorded as applied without running (see applySchema in db.ts).
  { id: "0001_baseline", sql: BASELINE_SQL },
];

export function checksum(sql: string): string {
  return createHash("sha256").update(sql).digest("hex");
}
