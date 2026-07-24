import type { ResumeData } from "./types";

export type SectionScore = {
  key: string;
  label: string;
  score: number; // 0-100
  tips: string[];
};

export type ResumeScoreResult = {
  overall: number; // 0-100, weighted average of sections
  sections: SectionScore[];
};

// Roughly the same category of "strong action verb" heuristics real resume
// scorers use. Not exhaustive on purpose - this is a heuristic signal, not
// a grammar engine.
const ACTION_VERBS = [
  "led", "built", "created", "developed", "designed", "launched", "managed",
  "drove", "improved", "increased", "decreased", "reduced", "delivered",
  "implemented", "engineered", "architected", "optimized", "streamlined",
  "automated", "spearheaded", "negotiated", "coordinated", "analyzed",
  "established", "founded", "scaled", "grew", "generated", "executed",
  "directed", "mentored", "trained", "resolved", "achieved", "won",
  "produced", "shipped", "owned", "partnered", "collaborated", "presented",
];

const HAS_NUMBER = /\d/;

function scoreContact(resume: ResumeData): SectionScore {
  const tips: string[] = [];
  const c = resume.contact;
  let points = 0;
  const maxPoints = 4;

  if (c.fullName?.trim()) points++;
  else tips.push("Add your full name.");

  if (c.email?.trim()) points++;
  else tips.push("Add an email address.");

  if (c.phone?.trim()) points++;
  else tips.push("Add a phone number.");

  if (c.location?.trim() || c.linkedin?.trim()) points++;
  else tips.push("Add a location or LinkedIn URL so recruiters can place and find you.");

  return { key: "contact", label: "Contact", score: Math.round((points / maxPoints) * 100), tips };
}

function scoreSummary(resume: ResumeData): SectionScore {
  const tips: string[] = [];
  const summary = resume.summary?.trim() ?? "";

  if (!summary) {
    return { key: "summary", label: "Summary", score: 0, tips: ["Add a 2-3 sentence professional summary."] };
  }

  const wordCount = summary.split(/\s+/).filter(Boolean).length;
  let points = 40; // credit for having one at all

  if (wordCount >= 15 && wordCount <= 60) points += 40;
  else if (wordCount < 15) {
    points += 15;
    tips.push("Your summary is quite short — aim for 2-3 full sentences.");
  } else {
    points += 20;
    tips.push("Your summary is long — tighten it to 2-3 sentences so it reads fast.");
  }

  if (/\bI\b/.test(summary)) {
    tips.push('Drop first-person pronouns like "I" — resume style omits them (e.g. "Led a team of..." not "I led a team of...").');
  } else {
    points += 20;
  }

  return { key: "summary", label: "Summary", score: Math.min(100, points), tips };
}

function scoreExperience(resume: ResumeData): SectionScore {
  const tips: string[] = [];
  const experience = resume.experience;

  if (experience.length === 0) {
    return { key: "experience", label: "Experience", score: 0, tips: ["Add at least one role."] };
  }

  let totalBullets = 0;
  let actionVerbBullets = 0;
  let quantifiedBullets = 0;
  let rolesWithGoodBulletCount = 0;

  for (const exp of experience) {
    const bullets = exp.bullets.filter((b) => b.trim());
    totalBullets += bullets.length;

    if (bullets.length >= 2 && bullets.length <= 6) rolesWithGoodBulletCount++;

    for (const bullet of bullets) {
      const firstWord = bullet.trim().split(/\s+/)[0]?.toLowerCase().replace(/[^a-z]/g, "");
      if (firstWord && ACTION_VERBS.includes(firstWord)) actionVerbBullets++;
      if (HAS_NUMBER.test(bullet)) quantifiedBullets++;
    }
  }

  if (totalBullets === 0) {
    return {
      key: "experience",
      label: "Experience",
      score: 20,
      tips: ["Add bullet points describing what you did in each role."],
    };
  }

  const actionVerbRatio = actionVerbBullets / totalBullets;
  const quantifiedRatio = quantifiedBullets / totalBullets;
  const bulletCountScore = rolesWithGoodBulletCount / experience.length;

  const score = Math.round((actionVerbRatio * 40 + quantifiedRatio * 35 + bulletCountScore * 25));

  if (actionVerbRatio < 0.5) {
    tips.push('Start more bullets with a strong action verb (e.g. "Led", "Built", "Reduced").');
  }
  if (quantifiedRatio < 0.4) {
    tips.push("Add numbers where you can — team size, percentage improved, revenue, time saved.");
  }
  if (bulletCountScore < 0.6) {
    tips.push("Aim for 2-6 bullets per role — too few reads thin, too many gets skimmed.");
  }

  return { key: "experience", label: "Experience", score, tips };
}

function scoreEducation(resume: ResumeData): SectionScore {
  if (resume.education.length === 0) {
    return { key: "education", label: "Education", score: 0, tips: ["Add at least one degree or program."] };
  }
  const complete = resume.education.every((e) => e.school.trim() && e.degree.trim());
  return {
    key: "education",
    label: "Education",
    score: complete ? 100 : 60,
    tips: complete ? [] : ["Fill in the school and degree for every education entry."],
  };
}

function scoreSkills(resume: ResumeData): SectionScore {
  const count = resume.skills.filter((s) => s.trim()).length;
  const tips: string[] = [];

  let score: number;
  if (count === 0) {
    score = 0;
    tips.push("Add your key skills — aim for 5-12 relevant ones.");
  } else if (count < 5) {
    score = 50;
    tips.push(`You have ${count} skill${count === 1 ? "" : "s"} listed — add a few more, aim for at least 5.`);
  } else if (count <= 15) {
    score = 100;
  } else {
    score = 75;
    tips.push("You have a lot of skills listed — consider trimming to the most relevant ones.");
  }

  return { key: "skills", label: "Skills", score, tips };
}

const WEIGHTS: Record<string, number> = {
  contact: 0.1,
  summary: 0.15,
  experience: 0.45,
  education: 0.1,
  skills: 0.2,
};

export function scoreResumeQuality(resume: ResumeData): ResumeScoreResult {
  const sections = [
    scoreContact(resume),
    scoreSummary(resume),
    scoreExperience(resume),
    scoreEducation(resume),
    scoreSkills(resume),
  ];

  const overall = Math.round(
    sections.reduce((sum, s) => sum + s.score * (WEIGHTS[s.key] ?? 0), 0)
  );

  return { overall, sections };
}
