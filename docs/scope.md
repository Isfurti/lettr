# Scope

## Target user
Job seekers worldwide (fresher to experienced) who need a resume, cover letter or resignation letter that passes ATS screening.

## Problem
Writing a good, ATS-friendly resume and tailored letters is slow and hard. Lettr gives structured editing, AI help that sticks to the user's own facts, and scoring against a job description.

## v1 (what is built today) [Certain: routes and lib files exist]
- Account: email/password, Google and LinkedIn sign-in, email verification, password reset
- Resume builder: editor, templates (free vs Pro split), colours/fonts, photo, import from upload (PDF/DOCX)
- Exports: PDF, DOCX, Google Drive (Pro)
- AI: bullet rewriting, summary, cover letter, resignation letter, ATS keyword match and score, ATS analyst, resume AI agent (Pro), resume fit
- Job tools: applications tracker, interview practice
- Billing: Razorpay (one-time passes and auto-renew subscriptions), regional pricing, GST invoices
- Guest builder (build before signing up), resume checker, free tools (bullet writer, cover letter writer)
- Reviews and feedback loop, in-app support inbox
- Admin: users, plans, subscriptions, invoices, reviews, support, AI cost, system/audit log
- SEO: country pages, guides, examples; legal pages (privacy, terms, refund, delivery)

## NOT in v1 (from your stated roadmap, not built) [Likely: no routes or tables found]
User profiles, company profiles and job board, posts/ads by users, chat and groups, courses and events, company reviews, blue-tick verification, mobile app.

Each of these is a separate project and needs its own scope doc before any code.

## Open scope questions
- Free plan limits and launch discount are in your notes as "undecided"; confirm what is live.
- Europe is skipped for now (name conflict); confirm the app blocks or hides EU checkout.
