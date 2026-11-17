# Change note 0003: security fixes from the pre-launch review

**Why:** the owner asked (2026-11-17) to fix all findings from the review of the "27 pre-launch checks" reel, one by one. Fable reviewed the findings. Each fix is its own small PR, in this order:

| # | Fix | Status |
|---|---|---|
| 1 | Photo field: only inline images reach the PDF renderer (server-side fetch / local file read) | this PR |
| 2 | Password login requires a verified email; OAuth no longer inherits an unverified password account | next |
| 3 | Cron routes refuse to run when `CRON_SECRET` is unset | next |
| 4 | Drive OAuth uses a random per-attempt state | next |
| 5 | Stop returning raw internal error text (health, AI, cron) | next |
| 6 | Password reset signs out old sessions; register stops revealing existing emails | next |
| 7 | Admin support page uses `requireAdmin` | next |
| 8 | Content-Security-Policy, report-only first | next |

## Fix 1 detail
- Risk fixed: react-pdf fetches any URL or local path given as an image source. The guest "fit to one page" route accepts a resume from anyone, and the PDF download route returns the result.
- Change: `lib/safe-photo.ts` accepts only `data:image/png|jpeg|webp;base64,...` up to about 1.1 MB; anything else is dropped (the PDF prints without a photo). Applied at both places where PDF photos are read (`ResumePdfDocument`, `NewPdfs`).
- Test: a local HTTP server stands in for an internal address; before the fix rendering fetched it (1 hit), after the fix 0 hits across every template.
- Risk of the change: a resume that stored a photo as a non-inline address (not something the editor produces) prints without the photo. Rollback: revert the commit.
