import { extraSections, type ResumeData } from "./types";
import { plainResume } from "./rich-text";
import { ACTION_VERBS } from "./resume-score";
import { scoreResumeAgainstJob, type AtsResult } from "./ats-score";

/**
 * The ATS score analyst: how well a resume will get through applicant
 * tracking systems (the software companies use to read and rank resumes)
 * and recruiters' first skim. Pure and instant, so it runs in the browser
 * for guests too. Four parts, each with checks that say what to fix:
 *
 * - Readable by job sites: layout, contact details, headings, characters
 * - Keywords for this job: only when a job post is pasted
 * - Content that ranks: numbers, action verbs, bullets, summary, length
 * - Structure and dates: titles, dates, order, education
 */

export type CheckStatus = "pass" | "warn" | "fail";

export type AtsCheck = {
  id: string;
  status: CheckStatus;
  label: string;
  detail: string;
  /** Builder section to open to fix it. */
  section?:
    "contact" | "summary" | "experience" | "education" | "skills" | "design";
};

export type AtsCategory = {
  id: "readable" | "keywords" | "content" | "structure";
  label: string;
  score: number;
  weight: number;
  checks: AtsCheck[];
};

export type AtsReport = {
  overall: number;
  verdict: string;
  categories: AtsCategory[];
  keywords: AtsResult | null;
  /** The most valuable fixes first. */
  topFixes: AtsCheck[];
};

/** Templates whose two-column layouts some older systems read out of order. */
const TWO_COLUMN = new Set(["sidebar", "split"]);
/** Templates with a label column or unusual section names. */
const SOFT_LAYOUT = new Set(["grid", "technical"]);

const pts: Record<CheckStatus, number> = { pass: 1, warn: 0.5, fail: 0 };

function category(
  id: AtsCategory["id"],
  label: string,
  weight: number,
  checks: AtsCheck[],
  bonus = 0,
): AtsCategory {
  const score = checks.length
    ? Math.round(
        (checks.reduce((n, c) => n + pts[c.status], 0) / checks.length) * 100,
      )
    : 100;
  return {
    id,
    label,
    weight,
    checks,
    score: Math.max(0, Math.min(100, score + bonus)),
  };
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^[+()\d][\d\s()+-]{7,}$/;
const ODD_CHARS = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}★☆✓✔✗➤►■□●◆]/u;
const DATE_LIKE =
  /^(?:[A-Za-z]{3,9}\.?\s+\d{4}|\d{1,2}[/-]\d{4}|\d{4}-\d{1,2}|\d{4}|present|current|now)$/i;

function yearOf(d: string): number | null {
  if (/present|current|now/i.test(d)) return 9999;
  const m = d.match(/(\d{4})/);
  return m ? Number(m[1]) : null;
}

export function analyzeAts(
  input: ResumeData,
  template: string,
  jobPost?: string,
): AtsReport {
  const r = plainResume(input);
  const c = r.contact;
  const extra = extraSections(r);
  const bullets = r.experience.flatMap((e) =>
    e.bullets.map((b) => b.trim()).filter(Boolean),
  );
  const allText = [
    r.summary,
    ...bullets,
    ...r.skills,
    ...extra.projects.map((p) => p.description),
    ...extra.achievements,
  ].join(" ");
  const words =
    allText.split(/\s+/).filter(Boolean).length +
    r.experience.length * 6 +
    r.education.length * 6;

  // ---------- Readable by job sites ----------
  const readable: AtsCheck[] = [];
  readable.push(
    TWO_COLUMN.has(template)
      ? {
          id: "layout",
          status: "warn",
          label: "Two-column layout",
          detail:
            "Some older tracking systems read two columns out of order. For big-company portals, a one-column template is safest.",
          section: "design",
        }
      : SOFT_LAYOUT.has(template)
        ? {
            id: "layout",
            status: "warn",
            label: "Unusual layout or headings",
            detail:
              "This template uses a label column or code-style headings. Most systems cope, but Classic, Modern or Minimal are the safest.",
            section: "design",
          }
        : {
            id: "layout",
            status: "pass",
            label: "One-column layout",
            detail:
              "Tracking systems read this template top to bottom, in the right order.",
          },
  );
  readable.push(
    !c.fullName?.trim()
      ? {
          id: "name",
          status: "fail",
          label: "Name missing",
          detail: "Add your full name at the top.",
          section: "contact",
        }
      : {
          id: "name",
          status: "pass",
          label: "Name at the top",
          detail: "Your name is the first thing systems read.",
        },
  );
  readable.push(
    !c.email?.trim()
      ? {
          id: "email",
          status: "fail",
          label: "No email address",
          detail: "Recruiters can't contact you. Add an email.",
          section: "contact",
        }
      : !EMAIL.test(c.email.trim())
        ? {
            id: "email",
            status: "fail",
            label: "Email looks wrong",
            detail: `"${c.email}" doesn't look like a valid email address.`,
            section: "contact",
          }
        : {
            id: "email",
            status: "pass",
            label: "Email readable",
            detail: "Written as plain text, so systems pick it up.",
          },
  );
  readable.push(
    !c.phone?.trim()
      ? {
          id: "phone",
          status: "warn",
          label: "No phone number",
          detail:
            "Most Indian recruiters call first. Add a phone number with country code.",
          section: "contact",
        }
      : !PHONE.test(c.phone.trim())
        ? {
            id: "phone",
            status: "warn",
            label: "Phone number looks unusual",
            detail: "Write it like +91 98765 43210 so systems recognise it.",
            section: "contact",
          }
        : {
            id: "phone",
            status: "pass",
            label: "Phone readable",
            detail: "Written in a format systems recognise.",
          },
  );
  readable.push(
    input.customization?.showPhoto && input.customization?.photoDataUrl
      ? {
          id: "photo",
          status: "warn",
          label: "Photo on the resume",
          detail:
            "Fine for many Indian and Gulf employers, but US, UK and many global companies prefer no photo, and systems ignore it.",
          section: "design",
        }
      : {
          id: "photo",
          status: "pass",
          label: "No photo",
          detail: "Nothing for systems to stumble on.",
        },
  );
  readable.push(
    ODD_CHARS.test(allText)
      ? {
          id: "chars",
          status: "warn",
          label: "Emoji or symbols in text",
          detail:
            "Symbols like ★ ✓ ► can turn into garbage when systems read your resume. Use plain words.",
        }
      : {
          id: "chars",
          status: "pass",
          label: "Plain characters",
          detail: "No emoji or symbols that could be misread.",
        },
  );

  // ---------- Keywords ----------
  const keywords =
    jobPost && jobPost.trim().length >= 30
      ? scoreResumeAgainstJob(input, jobPost)
      : null;
  const kwChecks: AtsCheck[] = [];
  if (keywords) {
    const pct = keywords.score;
    kwChecks.push(
      pct >= 70
        ? {
            id: "kw-match",
            status: "pass",
            label: `${pct}% of the job's key terms found`,
            detail:
              "Strong match. Systems that rank by keywords will place you well.",
          }
        : pct >= 45
          ? {
              id: "kw-match",
              status: "warn",
              label: `${pct}% of the job's key terms found`,
              detail: `Add the missing terms that are true for you, e.g. ${keywords.missingKeywords.slice(0, 4).join(", ")}.`,
              section: "skills",
            }
          : {
              id: "kw-match",
              status: "fail",
              label: `Only ${pct}% of the job's key terms found`,
              detail: `Many systems rank this low. Work in the terms that are true for you: ${keywords.missingKeywords.slice(0, 6).join(", ")}.`,
              section: "skills",
            },
    );
    // Keywords inside experience bullets count for more than a skills list.
    const bulletText = bullets.join(" ").toLowerCase();
    const inBullets = keywords.matchedKeywords.filter((k) =>
      bulletText.includes(k),
    ).length;
    kwChecks.push(
      keywords.matchedKeywords.length === 0
        ? {
            id: "kw-context",
            status: "fail",
            label: "Key terms not used in your experience",
            detail:
              "Show the job's skills in action inside your bullet points.",
            section: "experience",
          }
        : inBullets / keywords.matchedKeywords.length >= 0.4
          ? {
              id: "kw-context",
              status: "pass",
              label: "Key terms used in your experience",
              detail: "You show the skills in action, not just list them.",
            }
          : {
              id: "kw-context",
              status: "warn",
              label: "Key terms mostly in your skills list",
              detail:
                "Recruiters trust skills shown in bullets. Mention a few in what you did and the result.",
              section: "experience",
            },
    );
    const title = r.experience[0]?.role?.toLowerCase() ?? "";
    const jdHead = (jobPost ?? "").toLowerCase().slice(0, 400);
    const titleWords = title.split(/\s+/).filter((w) => w.length > 3);
    kwChecks.push(
      titleWords.length && titleWords.some((w) => jdHead.includes(w))
        ? {
            id: "kw-title",
            status: "pass",
            label: "Job title lines up",
            detail:
              "Your latest title shares words with the job title, which ranking systems weigh heavily.",
          }
        : {
            id: "kw-title",
            status: "warn",
            label: "Job title doesn't match",
            detail:
              "If it's honest, use the job's wording for your role in the summary (e.g. \"Product Marketing Manager with 6 years...\").",
            section: "summary",
          },
    );
  }

  // ---------- Content ----------
  const content: AtsCheck[] = [];
  const quantified = bullets.filter((b) => /\d/.test(b)).length;
  const actionLed = bullets.filter((b) =>
    ACTION_VERBS.includes(
      b
        .split(/\s+/)[0]
        ?.toLowerCase()
        .replace(/[^a-z]/g, "") ?? "",
    ),
  ).length;
  if (bullets.length === 0) {
    content.push({
      id: "bullets",
      status: "fail",
      label: "No experience bullets",
      detail: "Add 2-6 bullets per role: what you did and the result.",
      section: "experience",
    });
  } else {
    content.push(
      quantified / bullets.length >= 0.5
        ? {
            id: "numbers",
            status: "pass",
            label: `${quantified} of ${bullets.length} bullets have numbers`,
            detail: "Numbers prove impact and stand out on a quick read.",
          }
        : {
            id: "numbers",
            status: quantified / bullets.length >= 0.25 ? "warn" : "fail",
            label: `Only ${quantified} of ${bullets.length} bullets have numbers`,
            detail:
              "Add a number where you can: %, ₹, time saved, team size, customers, rankings.",
            section: "experience",
          },
    );
    content.push(
      actionLed / bullets.length >= 0.6
        ? {
            id: "verbs",
            status: "pass",
            label: "Bullets start with strong verbs",
            detail: "Led, Built, Grew... reads as ownership.",
          }
        : {
            id: "verbs",
            status: "warn",
            label: `${bullets.length - actionLed} bullets don't start with an action verb`,
            detail:
              "Start with what you did: Led, Built, Reduced, Launched, Negotiated.",
            section: "experience",
          },
    );
    const long = bullets.filter((b) => b.split(/\s+/).length > 35).length;
    content.push(
      long === 0
        ? {
            id: "length-b",
            status: "pass",
            label: "Bullets are easy to skim",
            detail: "Each one fits in a line or two.",
          }
        : {
            id: "length-b",
            status: "warn",
            label: `${long} bullet${long === 1 ? " is" : "s are"} very long`,
            detail: "Keep bullets under about 30 words so they get read.",
            section: "experience",
          },
    );
  }
  const sw = r.summary.trim().split(/\s+/).filter(Boolean).length;
  content.push(
    sw === 0
      ? {
          id: "summary",
          status: "warn",
          label: "No summary",
          detail:
            "A 2-3 line summary with your title and strengths helps ranking and the 6-second skim.",
          section: "summary",
        }
      : sw > 90
        ? {
            id: "summary",
            status: "warn",
            label: "Summary is long",
            detail: "Trim it to 2-3 sentences.",
            section: "summary",
          }
        : {
            id: "summary",
            status: "pass",
            label: "Summary present",
            detail:
              "Gives systems and recruiters your title and focus up front.",
          },
  );
  content.push(
    r.skills.length === 0
      ? {
          id: "skills",
          status: "fail",
          label: "No skills listed",
          detail:
            "Many systems search a skills section directly. Add 6-15 real skills.",
          section: "skills",
        }
      : r.skills.length < 5
        ? {
            id: "skills",
            status: "warn",
            label: `Only ${r.skills.length} skills listed`,
            detail:
              "Aim for 6-15 skills, matching the job's wording where honest.",
            section: "skills",
          }
        : r.skills.length > 25
          ? {
              id: "skills",
              status: "warn",
              label: `${r.skills.length} skills is a lot`,
              detail: "Keep the 10-20 that matter most for this job.",
              section: "skills",
            }
          : {
              id: "skills",
              status: "pass",
              label: `${r.skills.length} skills listed`,
              detail: "A good, searchable skills section.",
            },
  );
  content.push(
    words < 150
      ? {
          id: "length",
          status: "fail",
          label: "Very little content",
          detail:
            "Under about 150 words gives systems too little to match. Add roles, bullets and skills.",
          section: "experience",
        }
      : words > 1100
        ? {
            id: "length",
            status: "warn",
            label: "Long resume",
            detail:
              "Over about 1,100 words. Unless you're senior, aim for one page (Design → Fit to one page).",
            section: "design",
          }
        : {
            id: "length",
            status: "pass",
            label: "Good length",
            detail: "Enough to match on, short enough to read.",
          },
  );

  // ---------- Structure ----------
  const structure: AtsCheck[] = [];
  const titled = r.experience.filter(
    (e) => e.role.trim() && e.company.trim(),
  ).length;
  structure.push(
    r.experience.length === 0
      ? {
          id: "roles",
          status: "warn",
          label: "No work experience",
          detail:
            "Add internships, freelance or part-time work. For freshers, projects count too.",
          section: "experience",
        }
      : titled === r.experience.length
        ? {
            id: "roles",
            status: "pass",
            label: "Every role has a title and company",
            detail: "Systems file each job correctly.",
          }
        : {
            id: "roles",
            status: "fail",
            label: "A role is missing its title or company",
            detail: "Fill in both so systems can file the job.",
            section: "experience",
          },
  );
  const dates = r.experience
    .flatMap((e) => [e.startDate, e.endDate])
    .concat(r.education.flatMap((e) => [e.startDate, e.endDate]));
  const filled = dates.filter((d) => d?.trim());
  const odd = filled.filter((d) => !DATE_LIKE.test(d.trim()));
  structure.push(
    r.experience.length === 0
      ? {
          id: "dates",
          status: "fail",
          label: "No work dates",
          detail:
            "Add your roles with start and end dates so systems can work out your experience.",
          section: "experience",
        }
      : r.experience.some((e) => !e.startDate.trim())
        ? {
            id: "dates",
            status: "fail",
            label: "Missing dates",
            detail:
              "Add a start date (month and year) to every role. Systems use them to work out your experience.",
            section: "experience",
          }
        : odd.length
          ? {
              id: "dates",
              status: "warn",
              label: "Some dates are hard to read",
              detail: `Use "Jan 2024" style dates instead of "${odd[0]}".`,
              section: "experience",
            }
          : {
              id: "dates",
              status: "pass",
              label: "Dates are clear",
              detail: "Systems can calculate your years of experience.",
            },
  );
  const starts = r.experience.map(
    (e) => yearOf(e.endDate) ?? yearOf(e.startDate),
  );
  const ordered = starts.every(
    (y, i) =>
      i === 0 ||
      y === null ||
      starts[i - 1] === null ||
      (starts[i - 1] as number) >= (y as number),
  );
  if (r.experience.length > 1)
    structure.push(
      ordered
        ? {
            id: "order",
            status: "pass",
            label: "Newest job first",
            detail: "The order recruiters and systems expect.",
          }
        : {
            id: "order",
            status: "warn",
            label: "Jobs aren't newest first",
            detail: "List your most recent role at the top.",
            section: "experience",
          },
    );
  structure.push(
    r.education.length
      ? {
          id: "education",
          status: "pass",
          label: "Education included",
          detail: "Many filters check for a degree.",
        }
      : {
          id: "education",
          status: "warn",
          label: "No education",
          detail: "Add your highest qualification. Many portals filter on it.",
          section: "education",
        },
  );

  const categories = [
    category("readable", "Readable by job sites", 30, readable),
    ...(keywords
      ? [
          category(
            "keywords",
            "Keywords for this job",
            30,
            kwChecks,
            Math.round((keywords.score - 50) / 5),
          ),
        ]
      : []),
    category("content", "Content that ranks", keywords ? 25 : 40, content),
    category("structure", "Structure and dates", keywords ? 15 : 30, structure),
  ];
  const totalWeight = categories.reduce((n, cat) => n + cat.weight, 0);
  const overall = Math.round(
    categories.reduce((n, cat) => n + cat.score * cat.weight, 0) / totalWeight,
  );

  const order: Record<CheckStatus, number> = { fail: 0, warn: 1, pass: 2 };
  const weightOf = (id: string) =>
    categories.find((cat) => cat.checks.some((ch) => ch.id === id))?.weight ??
    0;
  const topFixes = categories
    .flatMap((cat) => cat.checks)
    .filter((ch) => ch.status !== "pass")
    .sort(
      (a, b) =>
        order[a.status] - order[b.status] || weightOf(b.id) - weightOf(a.id),
    )
    .slice(0, 5);

  const verdict =
    overall >= 85
      ? "Excellent. This resume will read cleanly and rank well."
      : overall >= 70
        ? "Good. A few fixes will help it rank higher."
        : overall >= 50
          ? "Fair. Fix the items below before applying to big-company portals."
          : "Needs work. Systems may skip or misread this resume.";

  return { overall, verdict, categories, keywords, topFixes };
}
