# Tasks

Status as of 2026-11-15: T1, T2, T3 (audit), T4 and S1/S2 from the audit are done. S3 done by setting `CRON_SECRET`. Remaining tasks are still proposals; approve each one before work starts.

Ordered by risk. Each is a small slice with acceptance criteria.

| # | Task | Why | Done when |
|---|---|---|---|
| T1 (done) | Fix stale docs (Stripe -> Razorpay, README limitations, package name `resumeai`) | Docs lie today | ARCHITECTURE.md and README match code |
| T2 (done) | Repo hygiene: remove committed zips, `tsconfig.tsbuildinfo`, `New folder/`, `screen.png`, `code.html` (or move to a design-assets repo); add to .gitignore | Public repo is cluttered and large | Fresh clone has only source + docs |
| T3 (audit done, see security-audit.md) | Security audit: cron routes fail open when `CRON_SECRET` is unset (fix: refuse to run), webhook signature is OK, auth + ownership check on every `/api` route, encrypt Google tokens, rate limit on login/register | Money and personal data | Written checklist, all routes pass, tests added |
| T4 (done) | Company details out of public repo: `lib/company.ts` holds the office address and GSTIN in a public repo; you wanted them off the public site. Move to env vars. | Matches your stated wish | No address/GSTIN in repo; invoices still render |
| T5 | Real migrations (numbered SQL files, run in CI and deploy) replacing runtime `ensureSchema` | Safe renames, backfills, rollback | Fresh DB and existing DB reach the same schema; test covers it |
| T6 | Add a `version` to resume JSONB | Needed before changing resume shape | Old rows load via an upgrade function |
| T7 | Staging environment + separate DB, secrets per environment | Test billing/AI without touching production | Staging URL deploys from a branch |
| T8 | Backups + tested restore; uptime monitor + Sentry alerts | Recovery | One restore drill done and written down |
| T9 | Add lint to CI; branch protection requiring CI | Quality gate | PRs blocked on failing CI |
| T10 | Scope doc per future phase (profiles, jobs, chat, ads, mobile app) before any code | Biggest future risk is building them ad hoc | One scope.md per phase, approved |

Suggested order: T3, T4, T7, T8, then T1, T2, T9, T5, T6, T10.
