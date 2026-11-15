# Architecture

One Next.js 16 app (App Router, TypeScript): pages + API routes together. Postgres via `pg`, no ORM. Deployed on Vercel (vercel.json, cron jobs). [Certain]

```
Browser --> Next.js pages (app/) --> API routes (app/api/*) --> lib/* (business logic) --> lib/db.ts --> Postgres
                                                   |--> Anthropic API (lib/ai*.ts)
                                                   |--> Razorpay (lib/razorpay.ts, webhook)
                                                   |--> Google (OAuth, Drive), LinkedIn (OAuth)
                                                   |--> Resend (email), Sentry (errors)
Vercel cron --> /api/cron/billing (02:00), /api/cron/reviews (03:30)
```

## Rules the code follows (keep them)
- Business rules live in `lib/`, not in routes or components. Plan rules are pure functions.
- Only `lib/db.ts` talks to Postgres.
- Admin actions that touch user data call `logAdminAction()`.
- Resume templates exist twice: live preview and PDF renderer (different engines).
- AI output passes an honesty check; cost controlled by model routing, cache, caps.

## API groups (app/api)
auth (register, login via NextAuth, verify, reset) · resumes (CRUD, import, pdf, docx, drive-export, fit) · letters (pdf, docx) · ai (bullets, summary, cover-letter, resignation, ats-score, ats-analyst, agent, feedback, guest-rewrite) · applications · interview · billing (checkout, verify, subscribe, cancel, webhook) · reviews, support · admin (users, reviews, invoices) · cron · health · account (delete)

## Auth
NextAuth v5, credentials + Google + LinkedIn, bcrypt. Admin = session email equals `ADMIN_EMAIL` (`requireAdmin()`). [Certain]

## Observations to verify (T3)
- Routes without a session check: register, forgot/reset password, NextAuth, health, consent-region (expected), and **billing/webhook** (verifies Razorpay signature [Certain]) and **cron/billing, cron/reviews**. The cron routes check `CRON_SECRET` only if it is set, so if it is missing in Vercel anyone can trigger them. [Certain] `CRON_SECRET` has since been set in production (S3 closed).
- Admin by single email env var: one account, no roles. Acceptable now; revisit with more staff.
- No staging environment visible in repo. [Unverified]

## Docs drift
Fixed on 2026-11-15 (T1). See also security-audit.md.
