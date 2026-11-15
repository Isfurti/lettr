# Data model (Postgres, `lib/db.ts` SCHEMA_SQL)

IDs are TEXT. All DB access goes through `lib/db.ts`. [Certain]

## Core
- **users**: id, email (unique), password_hash, name, plan, country_code, pricing_tier, pro_until, pro_plan, email_verified + token/expiry columns, password-reset token/expiry, Google tokens, AI consent/opt-out flags, usage counters. Legacy `stripe_*` columns are unused.
- **resumes**: user_id -> users (CASCADE), title, template, `data` JSONB, timestamps. Index on user_id.
- **job_applications**: user_id (CASCADE), company, role, status, dates, notes, resume_id -> resumes (SET NULL).
- **interview_sessions**: user_id (CASCADE), role, company, questions JSONB.

## Billing
- **payments**: order_id PK, user_id (SET NULL), plan_id, months, amount, currency, status, payment_id unique, paid_at. Unique keys make webhook + checkout confirmation idempotent.
- **pro_subscriptions**: Razorpay subscription, status, cancel_at_cycle_end, current_end.
- **razorpay_plans**: one Razorpay plan per price key.
- **invoices** + **invoice_counters**: GST invoice numbers per financial year; buyer details copied onto the invoice; user_id SET NULL so invoices survive deletion.

## Trust, safety, ops
- **rate_limit_events**, **free_uses** (user/email-hash/device), **ai_usage_events** (feature, model, tokens), **ai_result_cache**, **ai_feedback_events**
- **activity_log**, **admin_audit_log**, **support_messages**, **reviews**
- **schema_version**: hash of the SQL, so schema runs once per change under an advisory lock.

## Gaps and risks
1. **No versioned migrations.** Schema is `CREATE/ALTER IF NOT EXISTS` run at runtime. Fine for adding columns; unsafe for renames, type changes, data backfills, or rollback. [Certain] (T5)
2. **Secrets at rest.** Google access/refresh tokens are stored as plain TEXT. [Certain] Encrypt or confirm risk accepted. (T3)
3. **Unused columns** (`stripe_*`) add confusion. Remove in a proper migration.
4. **Resume `data` JSONB has no version field.** Changing its shape later will need a version number to migrate old rows. [Likely: not seen] (T6)
5. Tables for the future community phase do not exist; do not add until that phase has its own scope.
