# Change note 0005: remember where each sign-up came from

**Status:** DRAFT 2026-11-25, owner said "do it" on the fix. Spec first, then code. Privacy-page wording is proposed below, not applied.

**Why:** Lettr stores no source for an account, so ~70% of sign-ups cannot be tied to Google Ads, Google search or anything else (Ads reports at most 18 of 74 since launch). Every channel decision (ad budget, SEO, Reddit) is a guess until this exists.

## What is stored
`users.signup_source` JSONB, nullable (migration `0004_signup_source`; old rows stay null = "Not recorded"):
`{ channel, referrer_host, utm_source, utm_medium, utm_campaign, landing_path, first_seen, paid_click }`
- `channel`: `google_ads | meta_ads | organic_search | social | email | referral | direct` (derived by `classify()` in `lib/signup-source.ts`, pure function).
- Not stored: the raw click ID (gclid, fbclid), the full referrer URL, query strings, IP. `paid_click` is only true/false.

## Capture (first touch)
- `components/SourceCapture.tsx`, mounted once in the root layout. On the first page view with no `lettr_src` cookie it writes one: URL-encoded JSON, 30 days, `SameSite=Lax`, `Secure` in production, under 512 bytes. It never overwrites an existing cookie (first touch wins) and does nothing on `/admin`.
- Consent: same rule as `Analytics.tsx`. Opt-in regions (EU, UK, CH) only after "Allow"; elsewhere on by default; an explicit "deny" always wins. `fetchConsentRequired` is exported from `Analytics.tsx` for reuse; its behaviour is unchanged.
- Own-site referrers (getlettr.com, www, the vercel preview host) are ignored, so a later in-app page never counts as "referral".

## Persist
- `app/api/auth/register/route.ts` and `lib/oauth-user.ts` (`findOrCreateOAuthUser`) read the cookie with `next/headers` `cookies()` (same pattern as `lib/free-usage.ts`), validate it again server-side (`parseSourceCookie`: known keys only, length caps, bad input becomes null), pass it to `createUser`, then clear the cookie.
- No cookie (blocked, denied, bot, direct API call) stores `channel: "direct"` only if the cookie existed and said so; a missing cookie stores null, not a guess.
- `createUser` gets an optional `signupSource` argument. All other callers are unchanged.

## Show
- `/admin/users/[id]`: a "Source" line (channel, utm_campaign when present).
- `/admin/analytics`: "Sign-ups by source, last 30 days" with a "Not recorded" row. Uses one new `db.ts` query (all SQL stays in `db.ts`).
- Admin reads need no new audit entry: aggregate counts, and the user page already logs access.

## Tests
- Pure: `classify`, `parseSourceCookie` (tests/signup-source.test.ts), no database.
- DB: `createUser` with and without `signupSource`; the by-source count (tests/db.test.ts style, real Postgres).
- Gate: `tsc`, `eslint`, full vitest against local Postgres.

## Out of scope (separate decisions)
1. **Google/LinkedIn sign-ups never fire `trackSignUp`.** Only `app/signup/page.tsx` calls it, so GA4, Google Ads and Meta undercount sign-ups. Needs its own fix.
2. Making "Sign-up" its own Google Ads conversion action (a label env var like the existing Purchase one). Needs the action created in Ads first.
3. Storing the click ID for offline-conversion import.

## Proposed privacy wording (not applied, owner to approve)
"We remember which link or website brought you to Lettr, in one cookie for up to 30 days, and save the channel (for example Google search or an ad) on your account when you sign up. We do not store the full link or any click ID."
