# Change note 0003: security fixes from the pre-launch review

**Why:** the owner asked (2026-11-17) to fix all findings from the review of the "27 pre-launch checks" reel, one by one. Fable reviewed the findings. Each fix is its own small PR, in this order:

| # | Fix | Status |
|---|---|---|
| 1 | Photo field: only inline images reach the PDF renderer (server-side fetch / local file read) | done (#66) |
| 2 | OAuth sign-in no longer inherits an unverified password account (+ sessions end on password reset) | this PR |
| 3 | Cron routes refuse to run when `CRON_SECRET` is unset | next |
| 4 | Drive OAuth uses a random per-attempt state | next |
| 5 | Stop returning raw internal error text (health, AI, cron) | next |
| 6 | Register stops revealing existing emails (reset-signs-out-sessions landed with fix 2) | next |
| 7 | Admin support page uses `requireAdmin` | next |
| 8 | Content-Security-Policy, report-only first | next |

## Fix 1 detail
- Risk fixed: react-pdf fetches any URL or local path given as an image source. The guest "fit to one page" route accepts a resume from anyone, and the PDF download route returns the result.
- Change: `lib/safe-photo.ts` accepts only `data:image/png|jpeg|webp;base64,...` up to about 1.1 MB; anything else is dropped (the PDF prints without a photo). Applied at both places where PDF photos are read (`ResumePdfDocument`, `NewPdfs`).
- Test: a local HTTP server stands in for an internal address; before the fix rendering fetched it (1 hit), after the fix 0 hits across every template.
- Risk of the change: a resume that stored a photo as a non-inline address (not something the editor produces) prints without the photo. Rollback: revert the commit.

## Fix 2 detail
- Risk fixed: someone registers with a victim's email and their own password (account stays unverified). When the victim later signs in with Google/LinkedIn the accounts merged and the attacker's password kept working.
- Change: migration `0002_auth_epoch` adds `users.auth_epoch` (default 0). A session stores the number it was issued with; `lib/auth.ts` ends the session when the account's number differs (or the account is gone, as before; same one query per request). When an OAuth sign-in lands on an unverified password account, `claimUnverifiedAccount` replaces the password with an unusable one, clears verification and reset tokens, bumps the number and marks the email verified. A password reset also bumps the number, so old sessions end.
- Chosen instead of "block password login until verified": that would lock out genuine users who never clicked the email link.
- Effect on a genuine user who registered with a password, never verified, then used Google: their password stops working; they sign in with Google or use "forgot password".
- Existing sessions are unaffected (no stored number counts as 0, the default).
- Rollback: revert the code; the extra column is harmless.
