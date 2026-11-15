# Security audit (2026-11-15, commit 974f547)

Scope: every file under `app/api`, `lib/db.ts` (tokens, schema), `next.config.ts` headers. Read-only; no code changed by this audit.
Not covered: dependency vulnerabilities, Vercel/Razorpay/Google dashboard settings, load testing, penetration testing.

## Passed [Certain, read in code]
- Private routes check the session. Per-user data (resumes, applications, interviews, invoices) is looked up with the user id, so one user cannot read another's rows. Invoice PDF is owner-or-admin only.
- Razorpay webhook verifies the signature before acting.
- Rate limits exist on register, login, forgot-password, resend-verification, support, guest AI and resume check (anonymous traffic keyed by client key), plus a global daily cap on the guest AI.
- Security headers are set (HSTS, X-Frame-Options and others in `next.config.ts`).
- Admin routes use `requireAdmin()` and write to `admin_audit_log`.

## Findings
| # | Severity | Finding | Fix (needs your approval) |
|---|---|---|---|
| S1 | Medium | Password-reset and email-verification tokens are stored as plain text and looked up directly. Anyone who can read the database (backup leak, SQL access) can reset any account's password while a token is live. | Store a SHA-256 hash of the token; hash the incoming token before lookup. Existing live links stop working once. |
| S2 | Medium | Google access and refresh tokens are stored as plain text. A database leak gives access to users' Google Drive files the app can reach. | Encrypt with a key in an env var (AES-256-GCM), or confirm the scope is limited to files the app created. |
| S3 | Low | `/api/cron/billing` and `/api/cron/reviews` accept calls from anyone when `CRON_SECRET` is unset. The jobs only act on work that is already due, so impact is limited to extra load. | Confirm `CRON_SECRET` is set in Vercel. Optionally make the routes refuse to run when it is unset (production would then break if it is missing). |
| S4 | Low | Admin identity is one email in `ADMIN_EMAIL`. Anyone who takes over that mailbox or its sign-in becomes admin. | Turn on two-step verification for that mailbox. Later: admin roles and a second factor in the app. |
| S5 | Info | No Content-Security-Policy header found. | Add a report-only CSP first, then enforce. |
| S6 | Info | Dependency audit not run. | Run `npm audit` in CI. |

## Not verified
- Which environment variables are actually set in production.
- Whether the Razorpay webhook rejects replayed events beyond the idempotent payment record.
- Database access controls and backups on the hosting side.
