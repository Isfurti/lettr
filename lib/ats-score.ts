import { extraSections, type ResumeData } from "./types";
import { plainResume } from "./rich-text";

const STOPWORDS = new Set([
  "the","and","a","an","to","of","in","for","on","with","is","are","as","at",
  "by","be","this","that","will","you","your","we","our","it","or","from",
  "have","has","had","not","but","can","should","must","which","who","their",
  "they","them","he","she","his","her","its","if","than","then","also","into",
  "about","over","under","between","across","per","etc","including","include",
  // Job-posting filler: words that appear in almost every JD but say nothing
  // about the actual skills being hired for. Without these, a resume could
  // "match" a JD on words like "years" or "experience" alone.
  "years","year","experience","experienced","strong","preferred","required",
  "requirements","requirement","need","needs","looking","ideal","candidate",
  "candidates","role","position","job","work","working","team","teams","ability",
  "able","skills","skill","plus","bonus","knowledge","understanding","good",
  "great","excellent","proven","track","record","responsibilities","responsible",
  "join","company","opportunity","help","using","use","new","based","well",
  "within","all","any","more","most","other","such","what","when","where","how",
  "would","could","may","might","do","does","make","like","least","minimum",
  "senior","junior","level","mid","we're","you'll","you're","us","s",
  // Hiring-post verbs that describe the job ad, not a skill.
  "hiring","hire","seeking","seek","own","owning","run","running","partner","partners",
  "want","wants","love","passionate","day","days","week","weeks","month","months",
  "fast","paced","fast-paced","environment","culture","apply","applying","offer","offers",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+.#\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim().replace(/^[.-]+|[.-]+$/g, "")) // drop stray edge punctuation (e.g. sentence-final periods) but keep meaningful trailing symbols like c++ / c#
    .filter((w) => w.length > 1 && !STOPWORDS.has(w) && !/^[0-9+.%-]+$/.test(w)); // pure numbers like "5+" aren't keywords
}

// Extract candidate "keywords" from a job description: words/phrases that
// appear meaningfully often, plus common skill-like tokens (capitalized
// acronyms, tech terms with symbols like "C++", "Node.js").
export function extractKeywords(jobDescription: string, limit = 30): string[] {
  const tokens = tokenize(jobDescription);
  const freq = new Map<string, number>();
  for (const t of tokens) freq.set(t, (freq.get(t) ?? 0) + 1);

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);
}

function resumeToText(resume: ResumeData): string {
  const parts: string[] = [resume.summary, resume.skills.join(" ")];
  for (const exp of resume.experience) {
    parts.push(exp.role, exp.company, ...exp.bullets);
  }
  for (const edu of resume.education) {
    parts.push(edu.degree, edu.school);
  }
  const extra = extraSections(resume);
  for (const p of extra.projects) parts.push(p.name, p.description);
  for (const c of extra.certifications) parts.push(c.name, c.issuer ?? "");
  parts.push(...extra.languages, ...extra.achievements);
  return parts.join(" ");
}

export type AtsResult = {
  score: number; // 0-100
  matchedKeywords: string[];
  missingKeywords: string[];
  totalKeywords: number;
};

export function scoreResumeAgainstJob(input: ResumeData, jobDescription: string): AtsResult {
  const resume = plainResume(input);
  const keywords = extractKeywords(jobDescription);
  const resumeTokens = new Set(tokenize(resumeToText(resume)));

  const matched = keywords.filter((k) => resumeTokens.has(k));
  const missing = keywords.filter((k) => !resumeTokens.has(k));

  const score = keywords.length === 0
    ? 100
    : Math.round((matched.length / keywords.length) * 100);

  return {
    score,
    matchedKeywords: matched,
    missingKeywords: missing,
    totalKeywords: keywords.length,
  };
}
