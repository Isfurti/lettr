/**
 * "What job sites see": checks on the plain text that hiring software pulls
 * out of a resume file. No AI involved - these are simple, explainable rules
 * so the result is the same every time and costs nothing to run.
 */

export type ReadCheckStatus = "pass" | "warn" | "fail";
export type ReadCheck = { id: string; label: string; status: ReadCheckStatus; detail: string };
export type ResumeReadReport = {
  wordCount: number;
  sectionsFound: string[];
  sectionsMissing: string[];
  checks: ReadCheck[];
};

const SECTION_PATTERNS: { name: string; core: boolean; re: RegExp }[] = [
  { name: "Summary", core: false, re: /^(professional\s+)?(summary|profile|objective|about( me)?|career objective|career summary)\b/i },
  {
    name: "Experience",
    core: true,
    re: /^(work\s+|professional\s+|relevant\s+)?(experience|work history|employment( history)?|internships?|career history)\b/i,
  },
  { name: "Education", core: true, re: /^(education|academic(s| background| qualifications)?|qualifications)\b/i },
  { name: "Skills", core: true, re: /^(key\s+|technical\s+|core\s+|top\s+)?(skills|competencies|expertise|skills & tools)\b/i },
  { name: "Projects", core: false, re: /^(academic\s+|key\s+)?projects\b/i },
  { name: "Certifications", core: false, re: /^(certifications?|licen[cs]es?( & certifications)?|courses)\b/i },
];

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
// Loose on purpose: international formats, spaces, dashes, brackets.
const PHONE_RE = /(\+?\d[\d\s().-]{8,}\d)/;
const LINKEDIN_RE = /linkedin\.com\/(in|pub)\/[A-Za-z0-9_-]+/i;
const DATE_RE =
  /\b((jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?\s+\d{4}|\d{1,2}\/\d{4}|(19|20)\d{2})\b/gi;
const BULLET_LINE_RE = /^\s*([•●▪◦‣∙·*–-]|\d+[.)])\s+\S/;
// Replacement characters and private-use code points usually mean icons or
// a font that didn't convert to real text.
const BROKEN_CHAR_RE = /[�-]/g;

/** The section a line is a heading for (e.g. "WORK EXPERIENCE:" → "Experience"), or null. */
export function sectionNameOf(raw: string): string | null {
  const line = raw.trim().replace(/[:|]+$/, "");
  if (!line || line.length > 40) return null;
  return SECTION_PATTERNS.find((s) => s.re.test(line))?.name ?? null;
}

function findSections(lines: string[]) {
  const found = new Set<string>();
  for (const raw of lines) {
    const line = raw.trim().replace(/[:|]+$/, "");
    if (!line || line.length > 40) continue;
    for (const s of SECTION_PATTERNS) if (s.re.test(line)) found.add(s.name);
  }
  return found;
}

export function analyzeResumeText(text: string): ResumeReadReport {
  const clean = text.replace(/\r/g, "");
  const lines = clean.split("\n");
  const words = clean.split(/\s+/).filter((w) => /[A-Za-z\d]/.test(w));
  const wordCount = words.length;
  const found = findSections(lines);
  const sectionsFound = SECTION_PATTERNS.filter((s) => found.has(s.name)).map((s) => s.name);
  const missingCore = SECTION_PATTERNS.filter((s) => s.core && !found.has(s.name)).map((s) => s.name);
  const checks: ReadCheck[] = [];

  checks.push(
    wordCount >= 120
      ? { id: "text", label: "Text can be read", status: "pass", detail: `We read ${wordCount} words from your file.` }
      : {
          id: "text",
          label: "Very little text found",
          status: "warn",
          detail: `Only ${wordCount} words came through. If your resume is a scanned image or a picture, job sites may not read it at all.`,
        }
  );

  checks.push(
    EMAIL_RE.test(clean)
      ? { id: "email", label: "Email found", status: "pass", detail: "Recruiters can reach you." }
      : { id: "email", label: "No email found", status: "fail", detail: "Add your email as plain text, not inside an image or icon." }
  );

  checks.push(
    PHONE_RE.test(clean)
      ? { id: "phone", label: "Phone number found", status: "pass", detail: "Good for recruiters who call first." }
      : { id: "phone", label: "No phone number found", status: "warn", detail: "Most recruiters in India call before they email. Add your number." }
  );

  checks.push(
    LINKEDIN_RE.test(clean)
      ? { id: "linkedin", label: "LinkedIn link found", status: "pass", detail: "Recruiters often check it." }
      : { id: "linkedin", label: "No LinkedIn link", status: "warn", detail: "Add your LinkedIn URL so recruiters can see more about you." }
  );

  checks.push(
    missingCore.length === 0
      ? {
          id: "sections",
          label: "Main sections found",
          status: "pass",
          detail: `Found: ${sectionsFound.join(", ")}.`,
        }
      : {
          id: "sections",
          label: `Missing heading${missingCore.length > 1 ? "s" : ""}: ${missingCore.join(", ")}`,
          status: missingCore.length > 1 ? "fail" : "warn",
          detail:
            "Use plain, common headings like Experience, Education and Skills so the software knows where each part starts.",
        }
  );

  const dates = clean.match(DATE_RE)?.length ?? 0;
  checks.push(
    dates >= 2
      ? { id: "dates", label: "Dates found", status: "pass", detail: "Your timeline can be read." }
      : {
          id: "dates",
          label: "Few or no dates found",
          status: "warn",
          detail: "Add start and end dates (e.g. Jun 2022 – Present) to each role and degree.",
        }
  );

  const bulletLines = lines.filter((l) => BULLET_LINE_RE.test(l)).length;
  checks.push(
    bulletLines >= 3
      ? { id: "bullets", label: "Bullet points found", status: "pass", detail: `${bulletLines} bullet points read.` }
      : {
          id: "bullets",
          label: "Few bullet points",
          status: "warn",
          detail: "Short bullet points under each role are easier for people and software to scan than long paragraphs.",
        }
  );

  const broken = clean.match(BROKEN_CHAR_RE)?.length ?? 0;
  checks.push(
    broken <= 2
      ? { id: "chars", label: "No broken characters", status: "pass", detail: "Every character came through as text." }
      : {
          id: "chars",
          label: "Some symbols didn't come through",
          status: "warn",
          detail: `${broken} characters turned into gibberish, usually icons or special fonts. Use plain text instead.`,
        }
  );

  if (wordCount > 1100) {
    checks.push({
      id: "length",
      label: "Quite long",
      status: "warn",
      detail: `${wordCount} words is more than two pages for most people. Keep the most relevant parts.`,
    });
  }

  return { wordCount, sectionsFound, sectionsMissing: missingCore, checks };
}
