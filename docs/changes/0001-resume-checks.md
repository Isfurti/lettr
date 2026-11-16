# Change note 0001: five resume checks, counted in the score

**Why:** the owner's Ideas sheet lists five rows of type Check. On 2026-11-16 the owner approved building all five and counting them in the score.

**What changes for users:** the builder's Score tab and margin notes, the dashboard score and the free resume checker can show an extra "Accuracy" section with tips. A resume with a likely mistake scores up to 10 points lower. No page, template or export changes.

## How it counts (revised after review)
First design: a new section with 10 percent weight. Review found it could raise a weak resume's score, give a blank resume free points and silently push resumes over the 80 "strong" line. So:
- The five existing sections give the base score, exactly as before (same weights, same tips).
- Findings can only take points off: medium finding 3 points, low finding 1 point, total capped at 10. `overall = base - penalty`, never below 1 for a resume with content, 0 stays 0.
- Tips that only protect the candidate (see check 4) are shown but cost no points.
- The "Accuracy" section is added only when there are findings. Each tip's fix button opens the section it is about (`tipSections`).

## The five checks (`lib/resume-checks.ts`, pure functions, no AI or network)
1. **Years claimed vs dates (medium).** Reads "N years of experience" in the summary; skips claims about someone else ("a team with 20 years"). Real span = union of all role date ranges including earlier titles, so overlaps count once. Flags when the claim is above real + max(1 year, 20 percent). Skipped when no claim, claim under 2 years, or any date is unreadable. Skipped in the free checker, where AI reads the dates and may misread them.
2. **Same figure under two jobs (low).** Percentages, currency amounts and amounts with million/crore/lakh. Flags one figure under two different roles, or experience and projects or achievements. The summary repeating a best number is fine and not flagged.
3. **Tool names (low).** Whole skills-list entries and project tech pieces only, checked against a fixed list of wrong spellings and the correct casing of known tools. No fuzzy matching, so ordinary words are never "corrected".
4. **Country format (only when "Applying in" is US or UK).** Photo, date of birth or nationality: advice only, no points. The other country's spelling: needs two or more lowercase words, low. India, Europe and Gulf: nothing.
5. **Duty bullets (medium).** Two or more experience bullets that start with "responsible for", "worked on", "helped with", "duties included" and similar.

Dropped on review: edit-distance spell matching, word-count page-length rule, a separate "no numbers" bullet rule (the existing Experience score already covers numbers and action verbs).

## Risks
- A wrong accusation: each check skips when unsure; the years check is medium, not high, because people leave old jobs off.
- Scores shift for people who already saw one: down only, at most 10 points.
- Performance: linear scans of the resume text, run wherever the score already runs.
- Rollback: pure code. Reverting the commit restores the old score.

## Open items
- The sheet's tool example ("Alexi") is not enough to know which tool was meant. Add names to the lists in `lib/resume-checks.ts` as real resumes show them.
- Not built, as agreed: nothing beyond the five Check rows.
