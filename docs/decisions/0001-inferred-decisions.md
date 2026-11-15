# Inferred decisions (confirm or correct each)

Format: chosen / rejected / why. Sources: ARCHITECTURE.md, README, code comments, your notes.

1. **One Next.js app for UI + API.** Chosen over separate frontend/backend. Why: small team, one deploy. Revisit when a mobile app needs a stable public API.
2. **Postgres with raw SQL, no ORM.** Chosen over Prisma/Drizzle. Why: simple queries (per ARCHITECTURE.md). Revisit if queries or team grow.
3. **Tests against real Postgres, not mocks.** Why: mocks hid SQL bugs. Keep.
4. **Razorpay for payments.** Chosen over Stripe (stated by you). Consequence: international cards depend on Razorpay approval (`RAZORPAY_INTERNATIONAL`).
5. **Regional pricing by country, auto-renew subscriptions, no refunds, no student plan, no lifetime plan.** Stated by you.
6. **Anthropic API with model routing** (fast model for high-volume tasks, stronger model for Pro letters), result cache, batch API for reviews. Why: cost.
7. **AI may only use the user's own facts.** Code-level check blanks invented numbers.
8. **Keep the name Lettr**, skip Europe for now. Stated by you.
9. **Runtime schema creation instead of migrations.** Probably chosen for MVP speed. This is the one I recommend changing (T5).
