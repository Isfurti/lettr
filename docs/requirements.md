# Requirements

## Functional
See scope.md for the feature list. Rules found in code:
- Plan gating is pure functions in `lib/limits.ts`, free-plan AI allowance in `lib/free-plan.ts`. [Certain]
- Free AI use is lifetime, tracked per user, email hash and device (`free_uses`). [Certain]
- Daily AI caps exist (`lib/daily-caps.ts`). [Certain]
- Pricing: visitors see US prices; signed-in users see their country's price; admin sees all. [Likely: `pricesForViewer`]
- GST invoices issued from the company's GST registration, kept after account deletion. [Certain]
- AI must not invent facts or numbers (`lib/ai-honesty.ts`). [Certain]
- No prices in posts/reels (marketing rule, not app code).

## Non-functional
| Area | Target | Status |
|---|---|---|
| Availability | Fast pages, no cold-start crashes | Idle DB errors handled; no uptime monitor in repo [Unverified] |
| Security | Auth on every private route, secrets in env, input validated (zod) | Needs audit (T3) |
| Privacy | Region-based consent, account deletion, AI examples anonymised, opt-out via support | Implemented [Likely]; legal review is yours |
| Cost | AI cost per user bounded | Model routing, result cache, batch API, caps [Certain] |
| Data safety | Backups, restore tested | Not in repo; depends on DB host [Unverified] |
| Quality | Tests + typecheck + build on every PR | CI does this [Certain]; lint is not in CI |
| Observability | Errors visible | Sentry wired [Certain]; alerts [Unverified] |
| Scale | Not defined | Needs a number (e.g. users in year 1) to size DB and AI budget |
