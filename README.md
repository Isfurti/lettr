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
- **Tailwind CSS 4** with a custom design system: navy/gold/cream editorial palette, self-hosted Playfair Display + Inter fonts (via `@fontsource`, bundled at build time — no runtime dependency on Google's font CDN)
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

## Billing setup (Stripe)

Lettr's Free vs Pro plan matches Rezi's actual published pricing:

| | Free | Pro ($19/mo) |
|---|---|---|
| Resumes | 1 | Unlimited |
| PDF downloads | 3 | Unlimited |
| Cover letter builder | ❌ | ✅ |
| Resignation letter builder | ❌ | ✅ |

To enable it:
1. Create a Stripe account, go to **Products**, create a recurring $19/month price. Copy its Price ID into `STRIPE_PRO_PRICE_ID`.
2. Copy your **Secret key** from the Stripe dashboard into `STRIPE_SECRET_KEY`.
3. Add a webhook endpoint in Stripe pointing at `https://your-domain.com/api/billing/webhook`, subscribed to `checkout.session.completed`, `customer.subscription.updated`, and `customer.subscription.deleted`. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.
4. For local testing, use the Stripe CLI: `stripe listen --forward-to localhost:3000/api/billing/webhook`

Without real Stripe keys, everything else in the app still works — the app just can't process real upgrades (the `/pricing` page's checkout button will error).

## Social login setup (Google + LinkedIn)

Both are optional — the app works fine with just email/password login if you
skip this. When configured, "Continue with Google" / "Continue with LinkedIn"
appear on the login and signup pages automatically (no code change needed,
just add the env vars).

**Account linking:** if someone signs up with a password using
`jane@example.com`, then later clicks "Continue with Google" using that same
Google account, they're signed into the *same* account — not a duplicate.
This is handled in `lib/oauth-user.ts` (tested against real Postgres in
`tests/oauth-user.test.ts`).

### Google
Reuses the same Google Cloud OAuth app as Google Drive export (`GOOGLE_CLIENT_ID`
/ `GOOGLE_CLIENT_SECRET`) — you need **two** redirect URIs registered on it,
not one:
1. `https://your-domain.com/api/auth/callback/google` (for login)
2. `https://your-domain.com/api/google/callback` (for Drive export — see below)

Add both under **Google Cloud Console → Credentials → your OAuth client →
Authorized redirect URIs**.

### LinkedIn
1. Create an app at **linkedin.com/developers**
2. Under **Products**, request **"Sign In with LinkedIn using OpenID Connect"**
3. Under **Auth**, add redirect URL: `https://your-domain.com/api/auth/callback/linkedin`
4. Copy the **Client ID** and **Client Secret** into `LINKEDIN_CLIENT_ID` / `LINKEDIN_CLIENT_SECRET`

## Google Drive setup (Pro feature)

Lets Pro users save a resume PDF straight to their own Google Drive.

1. Go to the **Google Cloud Console** → create a project (or use an existing one)
2. **APIs & Services** → **Library** → enable the **Google Drive API**
3. **APIs & Services** → **OAuth consent screen** → configure it (External is fine for testing; add your own email as a test user while unverified)
4. **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth client ID** → type **Web application**
5. Add an **Authorized redirect URI**: `https://your-domain.com/api/google/callback` (and `http://localhost:3000/api/google/callback` for local dev)
6. Copy the **Client ID** and **Client Secret** into `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`

The app only requests the `drive.file` scope — it can only see/write files it creates itself, never a user's existing Drive contents.

Without real Google credentials, the rest of the app still works — the Drive export button will correctly show a "couldn't connect" state instead of crashing.

## Monitoring & ops setup

Three separate concerns, set up separately:

### Errors/crashes → Sentry
1. Create a free account at **sentry.io**, create a project (choose Next.js)
2. Copy the **DSN** it gives you into both `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN`
3. (Optional, for better stack traces) also set `SENTRY_ORG` / `SENTRY_PROJECT` from your Sentry project settings
4. That's it — uncaught errors on both client and server now report to Sentry automatically, and you can configure Sentry's own alert rules (email/Slack) for new issues

### Support requests → in-app inbox
- Anyone can submit a message at `/support` — no account required
- All messages are stored in the `support_messages` table regardless of any other config
- Set `ADMIN_EMAIL` to your own account's email — that unlocks `/admin/support`, a private inbox only you can see (returns a 404, not a login prompt, to anyone else)
- Optional: set `RESEND_API_KEY` + `RESEND_FROM_EMAIL` (free tier at resend.com) to also get an email the moment someone submits a message. Without it, messages still save fine, you just have to check `/admin/support` yourself.

### Failed payments → Stripe dashboard + Sentry
- The webhook handler now captures `invoice.payment_failed` to Sentry as a warning (with the customer/amount) so you see it alongside other errors — it does not auto-downgrade the user, since Stripe's own retry schedule handles that
- For truly instant alerts, also turn on Stripe's own **Email notifications** for failed payments: Stripe Dashboard → **Settings** → **Notifications**

### Uptime → an external pinger (this can't be code in the app)
An uptime monitor has to run independently of your app — if the app is down, code running inside it can't report that. Use a free service:
1. **UptimeRobot** (or Better Uptime, Pingdom, etc.) → sign up free
2. Add a new monitor, type HTTP(s), URL: `https://your-domain.vercel.app/api/health`
3. Set the check interval (5 min is fine on the free tier) and your alert email/SMS
4. `/api/health` returns `200` with `{"status":"ok"}` when the DB is reachable, `503` otherwise — so this also catches database outages, not just "server is down"

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

## Rate limiting

The 5 endpoints that call Anthropic's API (bullet rewriting, summary writer,
cover letter, resignation letter, AI agent) are rate-limited per user via a
Postgres-backed sliding window (`lib/rate-limit.ts`) — 15-20 requests per 10
minutes depending on the endpoint. This is backed by the database (not an
in-memory counter) because Vercel runs multiple serverless instances that
don't share memory — an in-memory limiter would be trivially bypassed.

## Email verification & password reset

Both require `RESEND_API_KEY` to actually send emails:
- **Without it**: new accounts are auto-verified (we can't gate on an email
  we're incapable of sending), and password reset requests are accepted but
  no email goes out — there's currently no way to actually reset a password
  without Resend configured.
- **With it**: new accounts start unverified with a banner + resend option
  on the dashboard; `/forgot-password` sends a real reset link.

Unverified users are **not blocked** from using the app — the banner is a
nudge, not a gate. If you want verification enforced before certain actions
(e.g. before Pro checkout), that's a small addition to make, not built in
by default.

## SEO

**Technical/on-page (done):**
- Unique `<title>` and meta description per public page (landing, pricing, templates, privacy, terms)
- `/robots.txt` and `/sitemap.xml` generated dynamically (`app/robots.ts`, `app/sitemap.ts`)
- Open Graph + Twitter card tags for social link previews
- JSON-LD structured data (`SoftwareApplication`) on the landing page — honest fields only, no fabricated ratings/reviews
- **`/templates` is now publicly crawlable** — it previously redirected to `/login` before a visitor (or Googlebot) could see it at all, which meant zero SEO value for a page that should realistically rank for "resume templates" searches. Auth is now only required when actually creating a resume, not for browsing.

**Requires `NEXTAUTH_URL` to be set to your real production domain** in Vercel — the sitemap/robots/canonical URLs all derive from it. If it's still unset or pointing at localhost, fix that first or none of this resolves to real URLs in production.

**Content SEO (not done, and honestly the bigger lever):** the "resume examples for nurses," "how to write a resume with no experience" style pages that actually drive most of this category's organic traffic aren't built. That's a sustained content practice, not a one-time task — see the conversation this was built in for a longer discussion of what that would take.

## Guest builder (build before signing up)

Anyone can start building a resume at `/builder/new` with zero account —
manual editing, live preview, Resume Score, and Job Match all work for
anonymous visitors. Their draft is saved in the browser's `localStorage`
(see `lib/guest-draft.ts`), not on the server, since there's no account yet
to attach it to.

**What requires login:** AI features (bullet rewriting, cover letter, AI
agent) and actually downloading a file. Clicking Export shows a modal
prompting signup/login rather than calling the export API directly.

**What happens after they sign up:** `completeGuestExport()` in
`lib/guest-draft.ts` reads the local draft, creates a real saved resume via
the normal `/api/resumes` endpoint, immediately triggers the export they
originally clicked, and lands them in the real editor — their work is never
lost across the signup step.

**The watermark** is a CSS overlay on the live preview only ("SIGN IN TO
DOWNLOAD"), not baked into any actual file — since download is gated behind
login entirely, there's never a scenario where an anonymous user holds a
watermarked (or any) real export. Once logged in, the file has no watermark.

**Known testing limitation:** the localStorage/redirect handoff itself
needs a real browser to fully exercise end-to-end; what's verified here is
that the server-side API sequence it depends on (create resume → export)
works correctly with real data.

## Admin visual distinction

The admin portal uses a deliberately different color language from the
user-facing app — dark crimson sidebar instead of navy, a light rose-tinted
content background instead of cream, a permanent "⚠ Real user data — act
carefully" label, and a warning-stripe accent bar. This isn't just styling:
since admin has full read/write access to real user data (including
deleting accounts), making it visually unmistakable which panel you're in
is a real safety measure, not a preference.

## Resume import (upload an existing resume)

Authenticated users can upload a PDF/DOCX/TXT resume (`/api/resumes/import`)
and have AI extract it into a new, editable resume — text extraction via
`pdf-parse` and `mammoth`, structuring via `extractResumeFromText()` in
`lib/ai.ts`. Subject to the same free-tier resume cap and AI rate limit as
everything else.

**A real bug worth knowing about if you touch this code:** `pdf-parse`
depends on `pdfjs-dist`, which dynamically loads a worker file at runtime.
Next.js's bundler doesn't handle that dynamic import correctly by default —
it works fine in an isolated script but breaks in the actual built server
with a "cannot find module .../pdf.worker.mjs" error. The fix is
`serverExternalPackages: ["pdf-parse", "pdfjs-dist"]` in `next.config.ts`,
which tells Next.js to leave this package's module resolution to Node
directly rather than bundling it. If you ever remove or "clean up" that
config line, PDF import will silently break again.

## Reviews & feedback loop

Users leave a star rating + written feedback at `/dashboard/feedback`. AI
analyzes it (`analyzeReview()` in `lib/ai.ts`) into sentiment, specific
likes/dislikes pulled from their actual wording (not generic categories),
and a genuine personalized reply - shown immediately in the UI and emailed
if Resend is configured.

**Admin gets a dedicated "what don't they like" view** at `/admin/reviews`,
not just a raw list of reviews to read one by one - every extracted dislike
across every review is flattened into one panel, most recent first, each
tagged with who said it and their rating. Real stats (total, average
rating, distribution) computed live, no fabricated numbers.

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

- No AI Interview practice, Job Search tool, LinkedIn optimizer, or resume
  upload/parsing yet — all real Rezi features, but each is a substantial
  standalone feature, not a quick addition
- No email verification on signup
- The "Job Match" tab measures JD-keyword overlap; the separate "Score" tab
  covers Rezi's resume-quality scoring (formatting/content strength) —
  together they cover what Rezi Score + Keyword Targeting do
- The AI Agent (`lib/ai-agent.ts`) supports 9 tools covering contact,
  summary, experience, education, and skills edits. It does not yet call
  the ATS scorer or cover-letter generator as tools within the same
  conversation - those stay on their own tabs.
- No Privacy Policy or Terms of Service pages yet — needed before real launch

## Design system

The visual design (navy/gold/cream palette, Playfair Display headings, sidebar
app layout) was rebuilt to match a set of reference mockups. Two things were
deliberately **not** copied from those mockups, on principle rather than
preference:
- The reference landing page included a customer-logo bar (real companies)
  and named customer testimonials. Lettr has no actual customers yet, so
  reproducing those would be misleading marketing — the current landing page
  uses the same structure with honest placeholder content instead.
- The reference admin dashboard showed specific numbers (total users, revenue,
  AI usage volume). Rather than copy those numbers, `/admin` queries and
  displays Lettr's actual database — real user counts, real plan breakdown,
  real signups-per-week chart. It'll show real (small) numbers until there
  are real users, which is correct behavior, not a bug.
