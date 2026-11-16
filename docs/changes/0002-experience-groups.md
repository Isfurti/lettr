# Change note 0002: heading per role ("Overseas experience", "Earlier experience")

**Why:** the owner's Ideas sheet, only row of type Fix: "Order for 'Additional / overseas experience'. Older or overseas roles need a sensible place and label." On 2026-11-16 the owner chose "heading per role".

**What changes for users:** in the Experience editor, each job gets an optional "Group heading" field (suggestions: Overseas experience, Earlier experience, Additional experience, Volunteer experience). Jobs with no heading print exactly as today. Jobs with a heading print after the ungrouped jobs, in a block under that heading (small sub-heading inside the Experience section), in the same order the user entered them. Same in every template preview, PDF, Word export and ATS view.

## Design
- Data: `ExperienceEntry.group?: string` (trimmed, max 40 chars, plain text). No migration needed: absent = today's behaviour. Resume data version stays 1 (additive optional field; old code ignores it, so rollback is safe).
- One pure helper in `lib/resume-sections.ts`: `experienceBlocks(experience): { heading?: string; jobs: ExperienceEntry[] }[]`. Ungrouped jobs first (original order, no heading), then each distinct heading (case-insensitive match) in order of first appearance, jobs in original order within it. If no job has a heading the result is one block with no heading, so every existing render is unchanged.
- Render: every place that does `experience.map(...)` for display (editor preview templates, NewPreviews, ResumePdfDocument, NewPdfs, Word export, ATS/admin view) iterates `experienceBlocks()` and prints a small heading line before a block that has one. Heading style reuses each template's existing minor-heading style; no new colours or fonts.
- Not touched: AI prompts keep the plain list (heading is passed along as `group` text only where roles are listed, so AI can see that a role is overseas); score and checks: the years-vs-dates check still uses every job, grouped or not.
- Validation: server `prepareResumeJsonForSave` trims and caps `group` at 40 chars; empty string becomes absent.

## Risks
- ~28 render sites: a missed one prints jobs in entered order without a heading (still correct, just unlabeled). A test renders each template with a grouped resume and asserts the heading appears once.
- Page breaks: a heading must not be stranded at the bottom of a page in PDF (keep-with-next on the heading).
- Rollback: additive field. Reverting the commit hides headings; saved data keeps the field harmlessly.

## Not in scope
- Re-ordering UI (drag and drop), new section type, any other Ideas row.
