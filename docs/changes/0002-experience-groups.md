# Change note 0002: heading per role ("Overseas experience", "Earlier experience")

**Why:** the owner's Ideas sheet, only row of type Fix: "Order for 'Additional / overseas experience'. Older or overseas roles need a sensible place and label." On 2026-11-16 the owner chose "heading per role".

**What changes for users:** in the Experience editor, each job gets an optional "Group heading" field (suggestions: Overseas experience, Earlier experience, Additional experience, Volunteer experience). Jobs with no heading print exactly as today. Jobs with a heading print after the ungrouped jobs, in a block under that heading (small sub-heading inside the Experience section), in the same order the user entered them. Same in every template preview, PDF, Word export and ATS view.

## Design (revised after Fable review)
- Data: `ExperienceEntry.group?: string` (saved) and `groupHeading?: string` (set by `applyLayout` only, never saved, like `skillsGrouped`). Absent = today's behaviour. Resume data version stays 1; rollback is safe.
- `groupExperience()` in `lib/resume-sections.ts`: ungrouped jobs first (as entered), then each heading's jobs together (headings matched case-insensitively, in order of first use), stamping `groupHeading` on the first job of each group. No headings = same list returned untouched.
- `applyLayout` calls it, so the editor preview, PDF and Word all get the new order and the stamp. Each render site adds one line inside its existing job block: `GroupHeading` (HTML) or `GroupHeadingPdf` (the heading sits inside the job's `wrap={false}` block, so it is never stranded at a page bottom); Word adds a keep-with-next paragraph. Shared `Job` (NewPreviews) and `Jobs` (NewPdfs) cover 12 templates; 9 editor previews and 9 PDF layouts get one line each.
- Validation: there is no per-field save validation in the app (PUT stores the data as sent), so the trim and 40-character cap are applied when reading (`cleanGroup`), and the input has `maxLength`.
- Order: the editor form, ATS checks ("newest job first"), resume title, cover-letter and interview features keep using the order the user entered. Only printed output is re-ordered.
- Admin view: shows the heading in brackets after the job, in entered order.
- Not changed: AI prompts (they do not see the heading), the years check (grouped jobs still count towards years).

## Risks
- ~28 render sites: a missed one prints jobs in entered order without a heading (still correct, just unlabeled). A test renders each template with a grouped resume and asserts the heading appears once.
- Page breaks: PDF heading is inside the job block; Word uses keep-with-next.
- Real ATS parsers may read a small heading as a job title. Lettr's own checker ignores it; untested elsewhere. The heading is plain text and optional.
- Rollback: additive field. Reverting the commit hides headings; saved data keeps the field harmlessly.

## Not in scope
- Re-ordering UI (drag and drop), new section type, any other Ideas row.
