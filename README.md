# Lettr — AI Resume Builder (Rezi-style SaaS)

An AI-assisted resume builder: structured resume editor, ATS keyword match
scoring against a job description, AI bullet-point rewriting, AI cover letter
generation, PDF export, and account/auth.

## Stack

- **Next.js 16** (App Router, TypeScript) — full-stack: pages + API routes in one app
- **Postgres** (via `pg`) for the database — production-ready, works on serverless
  hosts like Vercel. Every call site only touches the functions exported from
  `lib/db.ts`, so switching providers (Neon, Supabase, RDS, etc.) is a
  connection-string change, not a code change.
- **NextAuth (Auth.js v5)** — credentials (email/password) auth, bcrypt hashing
- **Anthropic API** (`@anthropic-ai/sdk`) — AI bullet rewriting + cover letters
- **@react-pdf/renderer** — server-side PDF export
- **Tailwind CSS 4**
- **Vitest** — unit tests for the ATS scoring engine and the database layer (run against a real local Postgres instance)

## Local setup

```bash
# 1. Install Postgres locally, then:
createdb resumeai

# 2. Install deps and configure env
npm install
cp .env.local.example .env.local
# edit .env.local:
#   DATABASE_URL=postgres://postgres:postgres@localhost:5432/resumeai
#   ANTHROPIC_API_KEY=sk-ant-...          (get one at console.anthropic.com)
#   NEXTAUTH_SECRET=$(openssl rand -base64 32)

npm run dev
# open http://localhost:3000
```

Schema (users + resumes tables) is created automatically on first request —
no separate migration step needed for this MVP.

Without a real `ANTHROPIC_API_KEY`, everything works except the two AI
endpoints (bullet rewriting and cover letter generation) — auth, resume
CRUD, ATS scoring, and PDF export are all pure-code/no-external-API and work
immediately.

## Testing

```bash
createdb resumeai_test   # one-time, for the test suite
npm test         # runs the Vitest suite (14 tests: ATS scoring + real Postgres DB layer)
npx tsc --noEmit  # type-check
npm run build     # production build
```

## Project structure

```
app/
  page.tsx                    landing page
  login/, signup/              auth pages
  dashboard/                   resume list
  builder/[id]/                resume editor (form + live preview + AI tabs)
  api/
    auth/register              user signup
    auth/[...nextauth]         NextAuth handlers
    resumes/                   CRUD for resumes
    resumes/pdf                PDF export
    ai/generate-bullets        AI bullet rewriting
    ai/ats-score               ATS keyword match scoring (no external API)
    ai/cover-letter            AI cover letter generation
lib/
  db.ts                        database access layer (node:sqlite)
  auth.ts                      NextAuth config
  ai.ts                        Anthropic API calls
  ats-score.ts                 keyword extraction + scoring engine
  types.ts                     shared resume data types
components/
  ResumeEditor.tsx              the main builder UI
  ResumePdfDocument.tsx          PDF template
tests/
  ats-score.test.ts, db.test.ts
```

## Going to production

1. **Database**: already Postgres — for production, point `DATABASE_URL` at a
   managed instance (Neon, Supabase, Railway, RDS all work) instead of local
   Postgres. No code changes needed.
2. **Auth secret**: generate a real `NEXTAUTH_SECRET` (`openssl rand -base64 32`)
   and set it as an environment variable in your host, never commit it.
3. **Anthropic API key**: set `ANTHROPIC_API_KEY` as a server-side env var in
   your host's dashboard.
4. **Deploy**: this is a standard Next.js app, so Vercel is the path of least
   resistance (`vercel deploy` after `vercel login`, or connect the GitHub
   repo in the Vercel dashboard). Railway/Render/Fly.io also work with a
   Dockerfile if you'd rather not use Vercel.
5. **Payments**: there's no billing wired up yet. If you want a free/pro plan
   split, Stripe Checkout + a webhook that flips `users.plan` in the DB is the
   standard pattern — say the word and I'll wire it in.
6. **Rate limiting**: the AI endpoints call a paid API per request — add rate
   limiting (e.g. per-user daily cap) before opening this to the public, or
   costs can run away.

## Known limitations (MVP scope)

- Only one resume template style is actually differentiated visually
  (`compact` shrinks spacing; `modern` currently renders the same as
  `classic` — easy to extend in `ResumePreview` / `ResumePdfDocument`)
- No LinkedIn profile optimizer or job-application tracker yet (both are
  in Rezi's real product — straightforward to add as another `app/api/ai/*`
  route + tab if you want them)
- No email verification on signup
- No subscription/paywall gating yet — `users.plan` column exists but is unused
