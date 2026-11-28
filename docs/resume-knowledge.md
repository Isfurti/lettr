# Lettr: resume knowledge base

Last updated 28 Nov 2026. Everything here came out of our own work and research. It is meant to guide product, guides and ads. No prices anywhere.

How reliable each part is:
- **Checked:** we saw it in a source or in our own data.
- **General norm:** common practice, not checked against a source. Verify before putting it in the app as a hard rule.

---

## 1. Resume rules by country (general norm)

| Country | Document | Length | Photo | Personal details |
|---|---|---|---|---|
| USA, Canada | Resume (CV only for academic, research, some medical) | 1 page for most, 2 for long careers; US Letter | No | No age, DOB, marital status; city and state, not full address |
| UK, Ireland | CV | 2 pages of A4 at most; 1 is fine for school leavers | No | No DOB, nationality, marital status; town or city only |
| India | Resume or CV (both words used) | 1 to 2 pages | Not needed for most corporate jobs | Skip DOB, father's name, marital status unless asked; skip Class 10 and 12 for experienced people |
| Australia, NZ | Resume or CV | 2 to 3 pages common for experienced | Usually no | Keep to work facts |
| UAE and Gulf | CV | 1 to 2 pages | Varies | Employers often ask visa status and notice period; mention briefly |
| Singapore | Resume | Short and factual | Varies | Some employers ask current or expected salary; follow the job post |

Spelling: UK spelling for UK, India, Australia, Singapore; US spelling for USA. Use the local date format.

Product idea: the builder already has country chips (India, USA, UK, Europe, Gulf). Use this table to drive checks, for example warn when a US resume has a photo, or a UK CV is over 2 pages.

---

## 2. Section order that works

- **Fresher (India or UK graduate):** header, 2-line summary, education first, projects or internships, skills, achievements.
- **Experienced (3+ years):** header, summary (role, years, domain), grouped skills, experience (latest first), projects or certificates only if they help, education in one or two lines.
- **Commerce and MBA freshers:** education, internships and live projects, tools (Excel, Tally, CRM), positions of responsibility.
- **B.Tech freshers:** education, 2 to 3 projects (tools, problem, result), internships, technical skills grouped, certificates.
- **UK personal statement:** 3 to 4 lines: who you are, what you offer, what you want.

Rules of thumb:
- Lead with the strongest evidence for this job.
- Every bullet: verb, what you did, a result or scale. Numbers only if the person can explain them in an interview.
- Single column, standard headings, no tables, text boxes, icons, skill bars or photo (ATS safe).

---

## 3. What to remove

Objective lines like "seeking a challenging position"; photo (US, UK); age, DOB, marital status, father's name; full home address; Class 10 and 12 marks for experienced candidates; jobs older than about 15 years; skills the person cannot discuss; vague soft skills with no example.

---

## 4. Career gaps and returning to work

Advice we gave (and drafted a Quora answer for):
- Do not hide the gap. One honest line in the timeline, for example "Career break, 2023 to 2025 (family care, upskilling)". No long story.
- Put a summary at the top stating role, years, stack and that the person is returning to work.
- Add a "Recent projects and learning" section near the top: side projects, open source, freelance, volunteering, certifications.
- Refresh the skills list with tools actually used recently.
- Keep earlier achievements factual with numbers.
- Prepare a two-sentence answer for "what were you doing": why they stepped away, what they kept up, why they are ready now.

Product ideas:
- A "returning to work" template or a "career break" entry type with suggested wording.
- An AI prompt that suggests a "Recent projects and learning" section when it detects a gap.
- A check that flags unexplained gaps over a set length and links to our gap guide.

---

## 5. ATS notes

- An ATS score is a rough measure of how readable a resume is for software: clean text, standard headings, contact details, keywords matching the job. It is a guide, not a promise of shortlisting. Our copy already says this.
- Common problems: tables, columns, icons, photos in the wrong place, missing headings, text inside images.
- Naukri and company career pages struggle with the same layout problems.
- Match a job post by adding missing keywords only where they are true for the person. Do not copy the job post.
- Keep different versions: a base resume plus a short tailoring pass per role.

---

## 6. Wording: stronger verbs (true to the work only)

- **Managed:** led, coordinated, supervised, oversaw, directed, administered, organised.
- **Led:** headed, guided, spearheaded, mentored, chaired, launched, trained.
- **Responsible for:** handled, owned, prepared, delivered, maintained, processed, resolved.
- **Helped:** supported, assisted, contributed, collaborated, enabled, advised, facilitated.
- Rule: a stronger verb must still describe the real role. Supported is not led.

Product idea: a "weak verb" check in the resume score that offers these alternatives.

---

## 7. Cover letters and resignation letters

- **US cover letter:** half to one page; name the hiring manager if possible; open with the job and fit, 1 to 2 paragraphs with specific results, close with thanks and a next step; "Sincerely".
- **UK cover letter:** one page of A4; "Dear [Name]"; "Yours sincerely" with a name, "Yours faithfully" for "Dear Sir or Madam"; polite and modest.
- **Resignation letter (India):** date, to, subject, clear statement, last working day from the notice period, short thanks, handover offer. Short and neutral; reason optional.
- **Variants we wrote:** one-month notice, immediate effect (ask, don't announce; check the contract), better offer, health or family (share only what they want).
- Always tell users to check their contract for the notice period and buy-out terms. We are not giving legal advice.
- **NHS jobs:** many are applied for through an online application with a supporting statement matched to the person specification. Check the advert; the process can differ by employer. (Least certain page; verify against a current NHS job advert.)

---

## 8. What we shipped (SEO and content)

On `main` (a079e22) and `dev` (8bfe8bd adds a shorter "More guides" list):
- India-focused `/resume-checker` (title, FAQ, guide links).
- About 60 guides total, including law student cluster, resume formats (freshers, experienced, B.Tech, commerce and MBA), 5 resignation letters, synonyms for managed, led, responsible for and helped, USA (resume, cover letter, AI resume builder), UK (CV, graduate, school leaver, personal statement, cover letter, NHS), resume vs CV, rules by country.
- 6 new examples: civil engineer, data entry operator, electrical engineer fresher, receptionist, US customer service rep, UK graduate.
- Covers and real screenshots on every guide; back arrow on every guide.
- Sitemap resubmitted on 27 Nov: 128 pages discovered.

Not yet done: a cover letter screenshot on cover letter guides; per-guide share images; request indexing for individual pages; Hindi pages.

---

## 9. Competitor findings (checked from public sitemaps; page counts only)

- Winners publish one page per job title (Enhancv about 8,300 pages, Kickresume about 25,300, LiveCareer about 3,475, Resume.io about 1,393, Resume Genius about 1,346, Hiration about 2,300, Novoresume about 996, Zety about 1,425, Rezi about 481).
- Cover letters are the largest section for most.
- India-specific and fresher-specific pages are almost absent across competitors. This is our opening.
- Rezi has 58 resignation letter template pages, so the topic is not empty.
- UK-specific CV pages are few: LiveCareer about 7, Resume Genius about 12, Novoresume 89, Enhancv 629.
- We cannot match their volume soon. Pick narrow areas (law, hotel management, ITI trades, UK graduate CVs) and cover them well.
- Do not mass-publish AI pages untouched. Each page needs a real sample and a human read.

---

## 10. Search data we have

Search Console, last 90 days (before the new pages): homepage 363 impressions and 5 clicks; the LLB guide 349 impressions and 5 clicks at about position 4.5; ATS example and checklist about 112 to 144 impressions at position 80+; fresher format about position 72 to 74; brand "lettr" about position 6.7.

Gaps: no India keyword volumes yet (keyword tool quota was used up). Check volumes before writing more format pages.

---

## 11. Channels (what worked or failed)

- **Reddit:** the post was removed by Reddit's filters (new, low-karma account). r/SideProject blocks "resume" in titles and photos. Plan: build karma for 1 to 2 weeks with helpful comments, then message the moderators.
- **Quora:** answer real questions in full; mention Lettr in one last line, saying you built it; no copy-pasted answers; first few answers with no link. Queries to use are in the Quora list we made (resume format, ATS, resignation letter, CV format UK, career gap).
- **Directories:** Peerlist, AlternativeTo, SaaSHub, Product Hunt (launch last), BetaList, Uneed, Indie Hackers.
- **Google Ads:** two Search campaigns (UK US, IN UK UAE) were paused on 27 Nov. Account spend was about Rs 28,000 across Oct and Nov. A promotion of Rs 20,000 credit for spending Rs 20,000 was still "Processing". Advertiser verification was pending. Re-check before restarting.

---

## 12. Product improvement ideas, in one place

Not decisions. Each needs your yes before we build it.
1. Country rules in the score: photo (US, UK), length limits, personal details, spelling.
2. Career break entry and "returning to work" template.
3. Weak verb check with alternatives.
4. Gap flag with a link to the gap guide.
5. A cover letter screenshot on cover letter guides.
6. Per-guide share images.
7. Post-resume next steps: suggest cover letter, then LinkedIn, then interview practice.
8. Homepage test: resume-first headline vs toolkit-first headline, measured by sign-ups that become paid.
9. Hindi pages and more country pages later.

---

## 13. Rules we follow

- Never show prices in posts, reels, guides or ads.
- Lettr work on `dev` first; nothing to `main` without your word.
- Use exact Lettr brand colours.
- Do not invent real details: examples use made-up people and say so.
- Only honest claims: only Interview practice is free on a free account; LinkedIn, resignation letters and the job tracker are Pro.
