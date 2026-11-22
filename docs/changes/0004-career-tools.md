# Change note 0004: four job-seeker features (design, not built)

**Status:** APPROVED 2026-11-22 with the owner decisions at the bottom. Building Feature 3 first. (The brief said `0002-<name>.md`, but 0002 and 0003 already exist, so this is 0004.)

**Why:** people use Lettr to get a job. Today the score only lists tips, one resume cannot be tuned per job, freshers have no guided path, and LinkedIn is not covered.

**Build order (one branch and PR each):** 3 Fresher, 1 Fixer, 2 Tailor, 4 LinkedIn.

## What exists that we reuse
- Score: `analyzeAts` (`lib/ats-score.ts`, `lib/ats-analyst.ts`) gives checks with a `section` to open. `runResumeChecks` (`lib/resume-checks.ts`) gives `Finding`s (years claimed, repeated figure, tool names, country format, duty bullets).
- Honesty backstop: `lib/ai-honesty.ts` (`HONESTY_RULES`, `guardRewrites`, `blankInventedNumbers`, `unsupportedClaim`). Every AI text in these features goes through it. Invented numbers become `[X]`.
- AI calls: `lib/ai.ts` (`complete`, `honestOptions`, Haiku for small tasks). Route pattern: `app/api/ai/generate-summary/route.ts` (auth, plan limit, `checkDailyAiCap`, rate limit, `trackAiUsage`).
- Limits: `lib/limits.ts` (`DailyFeature`, `DAILY_LIMITS`, `PLAN_LIMITS`), `lib/daily-caps.ts` (`TRACKED` map), `lib/free-usage.ts`.
- Data and layout: `ResumeData` (`lib/types.ts`: projects, achievements, custom sections), `sectionOrder`/`hiddenSections` (`lib/layout.ts`), `lib/resume-sections.ts`, market rules `lib/market.ts`.
- Editor: `components/ResumeEditor.tsx` (tabs `edit | score | match | agent | cover-letter | resignation-letter`, one shared `jobPost`), `components/builder/AtsPanel.tsx`, `ScorePanel`.

## Shared design decisions
1. **Preview-then-apply everywhere.** Each feature produces a *proposal* (a list of changes, each with `before`, `after`, `why`). Nothing touches `data` until the user accepts. Accepted changes go through one `applyChanges(data, changes)` pure function that returns the new `ResumeData` plus an undo snapshot. Undo restores the snapshot (one level per action, kept in editor state).
2. **Honesty gate in code, not only in the prompt.** Any AI-written text is checked against its "source facts" with `guardRewrites`. **Correction after review:** `guardRewrites` only blanks invented numbers and drops a fixed list of claim words (targets, awards, promotions, scale, results with no number). It does NOT catch a new tool, skill or employer. So this is **new work**: `lib/ai-grounding.ts` with `ungroundedTerms(output, source)`: known tools and skills (from the lists already in `lib/ats-score.ts` and `lib/resume-checks.ts`) plus proper nouns in the output that do not appear in the source cause that option to be dropped. It is built and tested first, in the Feature 3 PR, and every later feature uses it. Gaps are returned as a list instead.
   Source text is **narrow**: for a bullet it is that bullet plus its role (as `polishBullet` does), never the whole resume, so a figure from one job cannot move into another. Pasted job posts and LinkedIn text are wrapped in clear delimiters, treated as data (the prompt says to ignore instructions inside them), and length-capped. Preview-then-apply and the grounding check limit what an injected instruction could do.
3. **New AI features need cap entries.** `DailyFeature`, `DAILY_LIMITS` (free, free_legacy, pro), `TRACKED`, `AiFeature` and `DAILY_FEATURE_LABELS` each get new keys. The numbers are an owner decision (see Q2).
4. **Remaining uses are shown** next to every AI button. Pro and legacy accounts: "N left today" from `countAiUsesAny`. **Correction after review:** free accounts are limited by the once-per-person lifetime record, not the daily count, so for them the label comes from `lib/free-usage.ts` ("1 free try left"). A free try needs a new `FreeFeature` name that exactly matches the `trackAiUsage` feature name, and a `recordUse` call in each new route (as `generate-summary` does). That is real plumbing per feature, not only numbers.
5. **Privacy.** Text goes to the AI only for the request. Nothing from LinkedIn paste or PDF is stored (not in the DB, not in `ai_cache`). Tailor saves only the resulting resume version, plus the job title/company the user typed, not the full job post. Existing anonymised-suggestion rules (`recordAiFeedback`, opt-out) are not touched, and the new routes do **not** call `recordAiFeedback` unless the user opts in as today.
6. **No pricing text** in any new copy. Locked states say "Pro feature" and link to the existing pricing page, as other features do today.
7. **Mobile first.** New UI is stacked cards on a phone (before and after one under the other, full-width buttons, 44px targets), side by side from `md` up. All buttons have text labels or `aria-label`; diffs use text markers (Before / After, + / -) as well as colour; contrast of navy `#041632` on cream `#fffdf8` and gold `#ffc94d` backgrounds is checked in the test pass.
8. **Brand.** Navy `#041632`, gold `#ffc94d`, gold-deep `#e0a800`, blue `#2f5bea`, cream `#fffdf8`; Bricolage Grotesque and Manrope via existing CSS variables, not new fonts. The tagline "From Lettr to your offer letter." is not added to any new screen.

## Feature 3. Fresher format and guidance (first)
**Flow.** In the builder (and the new-resume screen) a choice "I have little or no experience". It sets `customization.fresher = true` and, in one visible and undoable step, sets `sectionOrder` to Education, Projects, Skills, Achievements, then custom sections, then Experience (internships/volunteering). Hidden sections stay hidden; the user can reorder like today.
**Guided prompts.** For an item type (coursework, college project, club, hackathon, competition) the user answers 3 short questions (what did you build or do, tools, result or number). "Draft bullet" returns up to 3 options. Output is a project entry or a custom-section item added only after the user picks one.
**Guidance panel.** Static text, no AI: one page, what to leave out (photo for US/UK per market, personal details, objective-style summary), what goes first. Reads `market` for country differences.
**Data.** `ResumeCustomization.fresher?: boolean` (optional; old resumes unaffected; add to `lib/resume-version.ts` only if that file needs a bump, to be checked). No new table. No new template.
**AI.** `draftFresherBullets({kind, what, tools, result, market})` in `lib/ai.ts`, using `honestOptions` with source = the three answers. Route `POST /api/ai/fresher-bullets`. Counts as `rewrite` or a new key (Q2).
**Edge cases.** Empty answers (button disabled); result left blank gives `[X]` blanks; user later adds a real job (hint to switch the order back, never automatic); "fresher" resume in a template that hides projects (the existing hidden-sections state wins and we tell the user).

## Feature 1. Resume fixer
**Flow.** In the Score tab each tip that maps to a fixable finding gets a **Fix** button. It opens a before/after card with Accept, Reject. After accepting, undo is available and the score re-runs and shows "was 72, now 78".
**Rule-based fixes (no AI, no cap):**
- Tool names: from `runResumeChecks` tool findings, replace the skill or project tech entry with the correct spelling/casing (finding already knows the pair).
- Country spelling (US/UK): word-by-word replacement from the existing word lists, only on the words the finding flagged.
- Repeated figure: not auto-fixed. The card shows both places and asks "keep it here / keep it there"; the other bullet gets the figure replaced by `[X]` (honest blank) or removed, by the user's choice.
- Photo, date of birth, nationality (advice-only findings): "Remove" action clears that field (undoable).
**AI fixes (daily cap applies):**
- Duty bullet to outcome bullet: `honestOptions`, source = that bullet plus role, up to 3 options, `[X]` blanks.
- Years wording in the summary: the correct number is computed in code from the dates (`yearsOfExperience`), then the AI only rewrites the sentence around it; the number is passed through `extraNumbers`.
**Data.** No schema change. **Correction after review:** a `Finding` today is only `{id, severity, message, section, scored}`; the tool-name pair, spelling words, repeated figure and duty bullets live only inside the message text, and the repeated-figure check stops at its first repeat. So `lib/resume-checks.ts` must be extended so each check also returns structured `details` (tool: from/to; spelling: word list; figure: every place; duty: entry id and bullet index). Scores and messages stay identical; existing tests must pass unchanged. The two spelling lists have no pairing, so a US/UK mapping table is written (only words in the table are ever changed; gaps such as "organise" and "utilise" are added to it).
New `lib/resume-fixes.ts`: `fixesFor(resume, findings, market) -> Fix[]` and `applyChanges`. `Fix = {id, findingId, kind: "rule" | "ai" | "choice", target, before, after?, why}`. Bullets, skills and achievements are plain strings with no ids, so a target is **entry id + index + the exact `before` text**; if the text at that place no longer matches, the fix is dropped with "this changed, refresh".
**Routes.** `POST /api/ai/fix-bullet` (AI fixes only).
**Edge cases.** Two fixes touching the same bullet (apply in order, re-run findings after each); user edits while a card is open (stale check above); no findings (button hidden); AI returns only dropped options (existing "add a detail" message).

## Feature 2. Tailor to a job post, with saved versions
**Flow.** Tailor tab (or button on the Match tab) uses the shared `jobPost`. "Tailor" returns a proposal: reordered skills, a rewritten summary, reworded bullets (only ones that already say a thing the job asks for), and a **gaps** list (keywords the job needs that the resume lacks, shown as "not on your resume, add only if true"). A diff card per change (accept or reject each). "Save as new version" asks for a name ("Legal assistant"). The original is never changed.
**Data model options.** (A, recommended) a version is a normal row in `resumes` with two new nullable columns, `parent_id` (the original) and `version_name`. **Correction after review:** PDF, Word and Drive export take the resume data in the request body, not an id, so they work with either option; that is not a reason to prefer A. A's advantage is that the builder, autosave and sharing work unchanged. Costs of A to handle: `listResumesForUser` and the admin counts in `lib/db.ts` must treat versions explicitly (dashboard groups them under the original; admin stats count originals only). (B) a new `resume_versions(resume_id, name, data)` table with a switcher that swaps `data` in the editor; more new editor code. Either needs one new migration appended in `lib/migrations.ts` (migrations are checksummed: add a new one, never edit an old one). Every read or write by `parent_id` also filters by `user_id`, and creating a version first checks the user owns the parent (`getResume(parentId, userId)`).
**Autosave rule (important).** Autosave PUTs the editor's `data` to the open resume id. So accepted Tailor changes must never be applied into the original's `data`. The version row is created first (a copy of the original), the user is moved into that row, and accepted changes are applied there. The proposal and diff live in the Tailor panel state until then. A test asserts the original row is unchanged after tailoring.
**What counts toward limits, and what deleting does, are owner decisions** (Q5), not decided here.
**Never invent.**
- Skills reorder: only reorders existing skills (a pure function, no AI). Job keywords that are not already in the resume go to gaps, not to `skills`. This reuses the keyword matching already in `lib/ats-score.ts`.
- Summary and bullets: source = that bullet plus its role (summary: the resume's own summary plus its skills), never the job post. The job post is wording context only. `honestOptions` is private, returns a flat list of at most 3, and throws if none survive, which would fail the whole request on one bad bullet. So Tailor gets its own per-bullet path: each bullet is guarded on its own with `guardRewrites` plus `ungroundedTerms`; a bullet with no safe option is left as is and listed as "no safe rewrite", and the request still succeeds.
- Dates, employers, titles, degrees: never sent as editable fields to the model.
**AI.** `tailorResume({resume, jobPost, market})` in `lib/ai.ts` returns `{summary options, bullet rewrites keyed by entry id + index}`; cap key `tailor` (Q2). One call per tailor, bullets capped (for example the 8 most relevant) to bound cost and tokens.
**Edge cases.** Job post too short or empty; non-English post; resume with no experience (summary and skills only, say so); naming collisions (suffix "(2)"); free plan one-resume limit (Q1); a version whose original was deleted (cascade).

## Feature 4. LinkedIn profile optimisation
**Input (3 ways).** Paste per section; upload the LinkedIn PDF export (parsed with the existing `lib/extract-text.ts`, text only, file not stored); or "Start from my Lettr resume" which pre-fills the sections from `ResumeData`. First asks target role and country (maps to `market`; country-specific wording like US vs UK spelling).
**Output (all editable, each with a Copy button, nothing posted):**
- Profile score with reasons. Computed in code, no AI: headline length and keyword use, About length (1–3 short paragraphs), experience bullets present, skills count, completeness, target-role keyword coverage. Same style as the ATS report.
- Three headline options, 220 characters max (LinkedIn's limit, enforced in code, not trusted to the model).
- Rewritten About (2,600 characters max, enforced in code).
- LinkedIn-style experience rewrites, per role.
- Suggested skills and keywords for the target role: suggestions split into "you already show this" and "add only if true".
- Plain tips (photo, banner, custom URL, open to work): static text, no AI.
**AI.** `optimiseLinkedIn({sections, targetRole, market})`, `honestOptions`-style guard with source = everything the user pasted, so no invented facts. Cap key `linkedin` (Q2). One call for headline plus About, a second for experience, so one slow part does not lose everything.
**Where it lives.** New page `/linkedin` (signed in) rather than a builder tab, because it does not need a saved resume. Linked from the dashboard and the builder.
**Privacy.** Pasted text and the PDF text live in client state and the request only. No DB write, no cache, no logs of content (only the usage event with token counts, as every AI route does). A visible note says so.
**Edge cases.** PDF that is scanned or empty (clear error); very long paste (truncate with a notice, same as other routes); user in a non-supported market (neutral advice); someone pastes another person's profile (nothing stored, nothing linked).

## Out of scope
Reading or posting to LinkedIn; a new template; automatic edits of any kind; changing existing prices, limits or plan features (only new keys per Q2); multi-language output; a "fresher" score; storing job posts.

## Open questions for the owner
**Q1. Free or Pro?** (not decided by me)
- Option A (recommended): *Free* for the rule-based fixer, the Fresher path and guidance, the LinkedIn score and static tips. *AI parts* (AI fixes, fresher bullet drafting, tailor, LinkedIn rewrites) use the existing free allowance idea: a small once-per-person free try, then Pro. *Saved versions beyond the original* are Pro. Reason: the free parts help everyone get a clean resume and cost nothing to run; the AI parts cost money per call and match how cover letters and the analyst already work.
- Option B: everything free for the first use of each feature, Pro for more. Simpler message, a bit more AI cost.
Either way, the new limits live in `PLAN_LIMITS`, `DAILY_LIMITS` and `lib/free-usage.ts`; you choose the numbers and I do the plumbing.

**Q2. Daily and free-try numbers for the new AI keys** (`fix`, `fresher_bullet`, `tailor`, `linkedin`). Numbers are needed for all three tiers (free, free_legacy which has monthly limits, pro). My starting proposal, in line with today's values: free 1 each lifetime; free_legacy 3 a month each; Pro daily 20 / 20 / 10 / 5, all inside the existing `total`. Or should fixes and fresher bullets share the existing `rewrite` bucket (3 lifetime for free)? Sharing means a free user's 3 rewrites can be used up by one fixer session, so I do not recommend it.

**Q3. Versions: A or B above?** I recommend A.

**Q5. Versions and the resume limit.** A version is a full, editable resume. If versions do not count toward `maxResumes` (free = 1), free users get unlimited resumes through versions. Options: (a) versions are Pro-only and do not count toward the limit (recommended, matches Q1); (b) versions count like resumes. Also: when an original is deleted, delete its versions too (with a confirm), or keep them as stand-alone resumes? I recommend delete with confirm, but it is your call.

**Q4. Fresher path entry point:** only inside the builder, or also as a choice on the new-resume screen and the homepage? I propose the new-resume screen and the builder only.

## Test plan (vitest, `npx vitest run --exclude ".claude/**" --exclude "node_modules/**"`)
- `applyChanges`: accept, reject, undo restore the exact original; stale `before` is refused; order of two fixes on one bullet.
- Fixer: each rule fix changes only the flagged text; re-running `runResumeChecks` no longer reports it; score re-runs and never goes down after a fix.
- **Never invents facts (all features):** `ungroundedTerms` unit tests first, then end to end with fake model output containing an unknown tool, a new number, a new employer, an award, and an instruction hidden in the job post; assert each is dropped or blanked. Tailor: a job tool not in the resume appears in `gaps` and never in `skills` or any bullet. Original resume row is unchanged after saving a version.
- Ownership: another user's resume id as `parent_id` is refused; version queries never return another user's rows. Dashboard and admin counts follow Q5.
- Fresher: section order set and undone; hidden sections respected; guidance differs for US vs India.
- LinkedIn: headline never over 220 characters and About never over 2,600, whatever the model returns; PDF text path stores nothing (assert no DB or cache write function is called).
- Limits: new keys in `DAILY_LIMITS` for every tier, `canUseAiToday` blocks at the cap, remaining count is correct; free tier locked states carry no price text (a test greps new copy for currency symbols and "₹/$/per month").
- Routes: 401 signed out, 402 or 429 at cap, 400 on bad input, no raw error text (`publicMessage`).
- Render: the new section order prints in every template, PDF and DOCX (extend `tests/layout-render.test.tsx` and `tests/resume-sections.test.tsx` patterns).
- Manual: desktop and 375px phone width for each new screen, keyboard-only pass, contrast check.

## Housekeeping found while reading
- `node_modules` is not installed in this checkout, so `node_modules/next/dist/docs/` (the guide `AGENTS.md` says to read) cannot be read yet. I will run `npm install` and read the relevant Next guides (routing, route handlers, server vs client) before the first line of code.
- `.claude/` holds a stale copy that vitest must exclude (the brief's command already does).

## Owner decisions (2026-11-22) - these replace Q1 to Q5 above
- **Q1 Free or Pro:** free = rule-based fixer, fresher path and guidance, LinkedIn score and static tips. AI parts = a small free try, then Pro. Saved versions = Pro only.
- **Q3 Versions:** normal `resumes` rows linked to the original (`parent_id`, `version_name`).
- **Q4 Fresher entry point:** builder and new-resume screen only. No homepage change.
- **Q5:** versions do not count toward the free one-resume limit and are Pro-only. Deleting an original deletes its versions after a confirmation.
- **Consequence I am applying (tell me if wrong):** a free user's one Tailor try shows the proposal, the diff and the gaps list, but "Save as version" is Pro. The proposal is never applied into the original, so the original stays safe.

### Final limits table (Q2)
Free = once per person, for life. Legacy free = per month. Pro = per month. Daily fair-use caps (resets midnight India time) stay on top, as for every AI feature today.

| New AI feature | Free (life) | Legacy free (month) | Pro (month) | Daily cap: free / legacy / Pro |
|---|---|---|---|---|
| AI fixes (`fix`) | 1 | 3 | 100 | 1 / 3 / 20 |
| Tailor to a job (`tailor`) | 1 | 3 | 100 | 1 / 3 / 10 |
| LinkedIn rewrites (`linkedin`) | 1 | 3 | 100 | 1 / 3 / 5 |
| Fresher bullet drafts (`fresher_bullet`) | 3 | 5 | Unlimited | 3 / 5 / 60 |

The daily column is my proposal, copied from the pattern of the existing daily limits (free equals the lifetime allowance, legacy equals its monthly allowance, Pro is a fair-use ceiling like `rewrite: 60`). Pro "unlimited" for fresher drafts still has that daily ceiling, as Pro rewrites do today. Each is also counted in the all-AI daily `total` (free 15, legacy 25, Pro 150), which I leave unchanged.

## Feature 3 as built (PR 1)
- New: `lib/ai-grounding.ts` (checks AI text for tools, products or names the person never gave; used by every later feature), `lib/fresher.ts` (layout order, guided questions, where each answer is placed, guidance text), `app/api/ai/fresher-bullets/route.ts`, `components/builder/FresherPanel.tsx` (top of the builder Edit tab, also in the guest builder where drafting asks for sign-up).
- Limits as in the table above for `fresher_bullet` only (free 3 for life, legacy 5 a month, Pro unlimited, daily 3 / 5 / 60). The "N left" label shows on the free plan.
- Layout: Summary stays first, then Education, Projects, Skills, Achievements, your own sections, Experience. Nothing hidden or shown that the person had not chosen. Undo restores the earlier layout; each added bullet can be undone.
- Left out: the new-resume entry. `/builder/new` redirects straight into the builder for signed-in users, so there is no screen to put a choice on; the panel sits at the top of the builder instead. A `?path=fresher` shortcut was not built.
- Known limit: the grounding check does not look at lowercase tool names (see the `shortcut:` comment).
- Not run locally: the 25 test files that need Postgres (no database here); CI runs them.

## Feature 1 as built (PR 2)
- `lib/resume-checks.ts`: each finding now also carries structured `detail` (tool pairs, spelling words, every place a repeated figure sits, duty-bullet positions, the years span). Messages, scores and existing tests are unchanged (41 existing score and check tests pass untouched).
- `lib/resume-fixes.ts`: a fix is a list of exact text edits (place + before + after). `applyEdits` and `undoEdits` refuse if any place no longer holds the expected text, and change nothing if one edit fails.
- Free, rule-based (no AI, no limit): tool-name spelling and casing, US/UK spelling (only listed lowercase words), remove photo / date of birth / nationality for US and UK, repeated figure (you pick where it stays; the other gets a [X] blank).
- **Changed from the brief, tell me if wrong:** the "years wording" fix is rule-based, not AI. It only swaps the number for what the dates add up to (and is not offered when that is under 2 years, to avoid "1 years"). It needs no AI and cannot invent anything.
- AI fix: duty bullet to a result bullet, through `polishBullet` with the new grounding check, `POST /api/ai/fix-bullet`. Limits as in the table: free 1 for life, legacy 3 a month, Pro 100 a month, daily 1 / 3 / 20.
- UI: "Fix these" cards at the top of the Score tab (everyone sees them, including the guest builder). Before and after as labelled text, Accept, Skip, one Undo, and "Score 21 (was 20)" after a fix.
- Left out: bullets with bold/italic marks get no fix button (shortcut comment in the code); only the last fix can be undone; no per-tip fix inside the Pro breakdown list (the cards sit above it).

## Feature 2 as built (PR 3)
- Migration `0003_resume_versions`: `resumes.parent_id` (cascade delete) and `version_name`. A version is a normal resume row; `countResumesForUser` and the admin counts leave versions out.
- `lib/tailor.ts` (plain code): `planTailor` (gaps from the ATS keyword match, skills re-ordered only, bullets picked only if they already match the job), `applyTailorChanges` (refuses stale or skill-adding changes), `checkTailoredVersion` (server-side: a version may differ from its original only in skills order, summary and bullet text, and every reworded piece may use only names already in the person's text).
- `tailorResume` in `lib/ai.ts`: per-bullet guarded rewrites; a bullet with no safe option is left as is and listed. The job post is data only, never a source of facts.
- Routes: `POST /api/ai/tailor` (proposal only; free 1 for life, legacy 3 a month, Pro 100 a month, daily 1 / 3 / 10; counted before the AI runs; 3 requests per 10 minutes) and `POST /api/resumes/[id]/versions` (Pro only; max 20 per original; reads the original from the database).
- UI: new **Tailor** tab. Picks are applied to a copy and saved as a new version, so autosave can never write them into the original. Free users get one try with the proposal, diff and gaps; "Save as new version" is Pro.
- Hardened after review: the grounding check now catches a tool or employer that opens a sentence (e.g. "Python scripts...") and a longer list of lower-case tools and employers. Still a list, so an unknown lower-case name can slip through.
- Left out: a dashboard grouping of versions under their original (versions show as separate resumes titled "<title> - <name>"), a delete-original confirmation that mentions its versions, and what happens to versions if someone stops being Pro.
- Known gap: daily caps count usage after the AI call, so several requests sent at once can pass them; the free allowance is now recorded first, and the rate limit is 3 per 10 minutes.
- Not run locally: tests that need Postgres (no database here); CI runs them.

## Feature 4 as built (PR 4)
- Page `/dashboard/linkedin` (signed in), linked from a new dashboard card. Input three ways: paste per section, upload the LinkedIn PDF export (text read in code, file not stored), or start from a Lettr resume. Asks for target role and country first.
- Free, in code, no AI: profile score with reasons (updates as you type), the static tips, character limits (headline 220, About 2,600, enforced in code, not trusted to the model).
- AI (`optimiseLinkedIn`, `POST /api/ai/linkedin`): 3 headlines, 3 About versions, rewrites of the 6 longest experience points, and keywords split into "you already show" and "add only if true". Each part is guarded on its own; a part with no safe option comes back empty. Free 1 for life, legacy 3 a month, Pro 100 a month, daily 1 / 3 / 5. Counted before the AI runs and given back if nothing came back.
- Privacy: pasted text and the PDF go to the AI for this request only. No database write, no cache, no feedback record (a test greps the routes for this). Nothing is posted to LinkedIn: copy buttons only.
- Honesty: facts are only what the person pasted; the target role lends only its plain role words, never a tool name. Pasted text has angle brackets removed and sits in a data block the prompt says to ignore instructions in.
- Also from review: a failed Tailor run now gives the free try back too.
- Left out: the LinkedIn score is not saved anywhere; the PDF section split is best effort (check each box after upload); no link from the builder yet (dashboard only).
- Not run locally: tests that need Postgres; CI runs them.

## Decision 2026-11-22 (evening): career tools are Pro only

Owner decision (Sagar): Resume fixer (AI rewrites), Fresher bullet drafts, Tailor to a job and the LinkedIn rewrite are Pro only. Free and free legacy allowances for these four are now 0 in `PLAN_LIMITS`; Pro limits are unchanged (fixer 100, tailor 100, LinkedIn 100 a month, fresher bullets unlimited, all under the daily fair-use caps). Nobody loses a feature they had, because all four shipped today.

Still free: the rule-based fixes, the Fresher layout, the LinkedIn score and tips, and the ATS score. Panels show "Pro feature" with a link to Pro when the allowance is 0. The pricing page feature list is unchanged and still needs the owner's wording.
