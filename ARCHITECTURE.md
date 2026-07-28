# Architecture Guide

This doc exists so any developer — not just whoever built this — can find their
way around quickly. It explains *where things live* and *why*, not just *what*
the code does (the code itself should be readable enough for that).

## Stack, in one line
Next.js 16 (App Router, TypeScript) + Postgres (via `pg`, no ORM) + NextAuth v5
+ Anthropic API + Stripe + Tailwind 4.

## Folder map

```
app/                    Routes. Every folder = a URL path (App Router convention).
  api/                  Backend endpoints. Same folder-per-route rule.
  admin/                Admin-only pages, gated by lib/admin-auth.ts
  builder/[id]/         The resume editor - one dynamic route per resume
lib/                    All business logic lives here, NOT in components or routes.
  db.ts                 The ONLY file that talks to Postgres directly. Every
                         other file imports functions from here rather than
                         running its own queries. If you're adding a new query,
                         it goes in db.ts, not inline in a route.
  auth.ts                NextAuth config (providers, callbacks)
  ai.ts / ai-agent.ts    Anthropic API calls
  limits.ts              Free vs Pro plan rules - pure functions, no I/O
  rate-limit.ts          Sliding-window rate limiter, backed by Postgres
  resume-score.ts         Deterministic resume quality scoring (no AI call)
  ats-score.ts            Deterministic keyword-match scoring (no AI call)
  customization.ts        Color/font options for templates
components/            React components. Anything reused across 2+ pages
                         lives here rather than being redefined per-page.
tests/                  Vitest. See "Testing philosophy" below.
```

## Conventions worth knowing before you change anything

**Every database access goes through `lib/db.ts`.** No route or component
calls Postgres directly. This means: (a) if you ever swap Postgres for
something else, one file changes; (b) `db.ts`'s `ensureSchema()` runs before
every query, so tables get created lazily on first use - if you add a new
table, add it to the `CREATE TABLE IF NOT EXISTS` block in `ensureSchema()`.

**Plan gating is a pure-function decision, not scattered `if` statements.**
`lib/limits.ts` exports functions like `canCreateResume(plan, currentCount)`
that return `{ allowed: true }` or `{ allowed: false, reason }`. API routes
call these and translate the result into an HTTP status - the *business
rule* (what's allowed) and the *HTTP plumbing* (how to respond) are kept
separate on purpose, so the rules are testable without spinning up a server.

**Color/font customization works via CSS variable overrides, not per-template
rewrites.** Every resume template uses Tailwind classes like `text-seal` /
`bg-seal`, which resolve to `var(--color-seal)`. A wrapper `<div>` around
each preview overrides `--color-seal` inline based on the user's chosen
accent color, and every template picks it up automatically via normal CSS
cascade - see `ResumePreview` in `components/ResumeEditor.tsx`. Don't
hardcode colors in a template component; use the existing Tailwind classes
so this keeps working.

**PDF export can't reuse browser CSS.** `@react-pdf/renderer` has its own
styling system with no cascade/variables, so `components/ResumePdfDocument.tsx`
computes styles as plain objects per-request based on the same accent color
value. If you add a new resume template, you need to add it in *two* places:
the live preview (`ResumeEditor.tsx`) and the PDF version
(`ResumePdfDocument.tsx`) - they intentionally don't share code because
they're fundamentally different rendering engines.

**Admin access is audited.** Every admin action that reads or modifies a
specific user's data goes through `logAdminAction()` in `lib/db.ts`. See
"Admin access" below before adding new admin capabilities.

## Testing philosophy

Tests run against a **real local Postgres instance**, not mocks. This was a
deliberate choice: mocking the database hides real bugs (wrong SQL, wrong
column names, race conditions in upserts) that only show up against an
actual database engine. `vitest.config.ts` points `DATABASE_URL` at a local
test database - see the README's "Testing" section for one-time setup.

Pure-logic files (`limits.ts`, `resume-score.ts`, `ats-score.ts`,
`customization.ts`, `activity-format.ts`) are tested without touching the
database at all, since they don't do I/O.

## Admin access

`lib/admin-auth.ts` exports `requireAdmin()` - call this at the top of any
admin page or API route. It checks the logged-in user's email against the
`ADMIN_EMAIL` environment variable (case-insensitively, trimmed - see the
README's debugging notes if this ever mismatches).

Admin has full read/write access to user data (see `/admin/users/[id]`) -
viewing someone's resumes, changing their plan, or deleting their account.
**Every one of these actions is logged via `logAdminAction()` in `lib/db.ts`**
into the `admin_audit_log` table, recording which admin did what to which
user and when. This isn't optional or a suggestion - if you add a new admin
capability that touches user data, log it the same way. The audit log
itself is visible at `/admin/system`.

## Known rough edges (intentional, not oversights)

- Font customization only applies to the live preview, not PDF export -
  `@react-pdf/renderer` needs actual font files registered, not CSS, and
  that's a bigger integration than was worth doing for this pass.
- No ORM. Raw SQL via `pg`, on purpose - the queries are simple enough that
  an ORM would add a dependency without solving a real problem here. If the
  query complexity grows a lot, revisit this.
- Rate limiting and plan limits are separate systems (`rate-limit.ts` vs
  `limits.ts`) because they answer different questions - "is this abuse"
  vs "is this within what they're paying for."
