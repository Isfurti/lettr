# Staging: a separate database for previews

**Why:** every Vercel preview (one per branch or pull request) runs unmerged code. Until now previews used the production database, so a bad branch or a migration could change live data. Previews now use their own empty staging database. `lib/preview-guard.ts` makes a preview refuse to start if it is pointed at anything else.

**Do the steps in this order.** Production is never touched; the only side effect is that previews fail to build between steps 3 and 4.

## Steps (about 15 minutes, in the dashboards)

1. **Create the staging database.** In Neon, create a NEW PROJECT named `lettr-staging` (not a branch of the production project, a branch copies live data). Copy its connection string and its host name (the part after `@`, before `/`).
2. **Give previews their own login secret.** In Vercel (Project, Settings, Environment Variables) the `NEXTAUTH_SECRET` is shared by Production and Preview. Untick **Preview** on it, then add a new `NEXTAUTH_SECRET` for **Preview only** (any new random value, e.g. `openssl rand -base64 32`). This stops a login created on a preview from being accepted by production.
3. **Switch the database.**
   - Edit `DATABASE_URL`: untick **Preview** (keep Production). Do not change its value.
   - Add `DATABASE_URL` = the staging connection string, **Preview only**, type Sensitive.
   - Add `PREVIEW_DATABASE_HOST` = the staging host name, **Preview only**, type Plain.
4. **Check.** Redeploy one preview (push a commit to a branch). Open `/api/health` on the preview URL: `{"status":"ok"}`. In Neon, the staging project now has the tables (they are created by the migrations on the first request).
5. **Merge the guard** (this pull request) only after step 4 works. If you merge it first, previews fail until steps 1 to 3 are done.
6. **Delete old previews.** Existing preview deployments keep the production URL they were built with. Remove them in Vercel (Deployments) or just ignore them and never open them.

## Using staging
- Keep Vercel **Deployment Protection** on for previews, so only people signed in to your Vercel team can open them.
- `ADMIN_EMAIL` is set on previews too, so whoever registers that email first on the empty staging database becomes admin there. Register it yourself first.
- Previews cannot take payments (the Razorpay keys exist only in Production), cannot send email (no Resend key) and cannot connect Google Drive (no `TOKEN_ENCRYPTION_KEY`). That is intended.
- Google and LinkedIn sign-in will not work on preview URLs (their redirect addresses are fixed and do not allow wildcards). Use email and password on previews.
- Links and canonical addresses inside a preview may point at getlettr.com because the site address falls back to the production domain.
- Previews use the production `ANTHROPIC_API_KEY`. If you want a hard cap on preview spend, make a second key with a spending limit and set it for Preview only.
- The staging database starts empty. Create a test account and a few test resumes by hand.
