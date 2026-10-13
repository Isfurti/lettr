import { extraSections, type ResumeData } from "./types";
import { plainResume } from "./rich-text";

/**
 * Job-post keyword matching, in plain code (no AI), so it's instant, free
 * and gives the same answer every time.
 *
 * What counts as a keyword:
 * - known multi-word skills ("b2b sales", "stakeholder management", "power bi")
 * - known single skills and tools ("salesforce", "excel", "sql", "negotiation"),
 *   plus acronyms and tool-like words (CRM, B2B, C++, Node.js)
 * - other words the post uses, ranked below those
 * What doesn't: filler ("strong", "years"), generic verbs ("grow", "manage",
 * "build"), job-title nouns ("executive") and places ("Pune", "Maharashtra").
 *
 * Words are compared in a light base form, so "relationships" matches
 * "relationship" and "negotiate" matches "negotiation".
 */

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
  "want","wants","wanted","love","passionate","day","days","week","weeks","month","months",
  "fast","paced","fast-paced","environment","culture","apply","applying","offer","offers",
  // Generic action verbs: every job asks you to "grow", "build" or "manage"
  // something. The skill is the thing being managed, not the verb.
  "grow","grows","growing","generate","generating","close","closing","manage","manages",
  "managing","achieve","achieving","prepare","preparing","build","builds","building",
  "deliver","delivering","drive","driving","ensure","ensuring","support","supporting",
  "provide","providing","create","creating","maintain","maintaining","handle","handling",
  "develop","developing","assist","assisting","perform","performing","conduct","conducting",
  "identify","identifying","collaborate","collaborating","work","get","take","keep","set",
  // Describing words and time words that aren't skills.
  "key","various","multiple","daily","weekly","monthly","quarterly","annual","annually",
  "long-term","short-term","related","relevant","similar","equivalent","existing","current",
  "high","large","small","top","best","better","clear","quick","quickly","effective",
  "effectively","efficient","efficiently","successful","successfully","professional",
  "solid","deep","hands-on","familiarity","familiar","exposure","proficiency","proficient",
  "fluency","fluent","willing","willingness","ready","duties","duty","tools","tool",
  "business","organisation","organization","travel","travelling","traveling","two-wheeler",
  // More job-ad filler: describing words and verbs that say nothing about the skill itself.
  "write","writes","wrote","written","complex","simple","insight","insights","present","presenting",
  "detail","details","oriented","detail-oriented","attention","motivated","self-motivated","self-starter",
  "dynamic","driven","results-driven","fast-growing","world-class","cross-functional","functional",
  "problem","problems","solving","think","thinking","ownership","impact","impactful","excited","exciting",
  "query","queries",
  // Job-title nouns. Title matching is its own check (see ats-analyst.ts).
  "executive","executives","associate","officer","coordinator","assistant","trainee",
  "intern","specialist","analyst","analysts","manager","managers",
]);

/** Places: a job's location says nothing about the skills it needs. */
const PLACES = new Set([
  "india","remote","hybrid","onsite","on-site","wfh","location","locations","office","offices",
  "pune","mumbai","delhi","ncr","new-delhi","noida","gurgaon","gurugram","bengaluru","bangalore",
  "hyderabad","chennai","kolkata","ahmedabad","jaipur","lucknow","chandigarh","indore","bhopal",
  "nagpur","nashik","surat","vadodara","kochi","cochin","coimbatore","trivandrum","thiruvananthapuram",
  "mysore","mysuru","mangalore","visakhapatnam","vizag","vijayawada","bhubaneswar","patna","ranchi",
  "guwahati","dehradun","kanpur","agra","meerut","ghaziabad","faridabad","ludhiana","amritsar",
  "maharashtra","karnataka","gujarat","rajasthan","punjab","haryana","kerala","nadu",
  "telangana","andhra","pradesh","uttar","madhya","bengal","west","odisha","bihar","assam",
  "goa","uttarakhand","jharkhand","chhattisgarh","himachal","kashmir",
  "dubai","uae","singapore","london","usa","uk","us","canada","australia","germany","europe",
]);

/** Common multi-word skills, written in base form (see baseForm). */
const PHRASES = [
  // Sales
  "b2b sale", "b2c sale", "inside sale", "field sale", "channel sale", "retail sale", "enterprise sale",
  "lead generation", "sale pipeline", "pipeline management", "account management", "key account management",
  "client relationship", "customer relationship", "relationship management", "business development",
  "cold calling", "sale forecasting", "sale target", "revenue target", "dealer management",
  "distributor management", "channel partner", "territory management", "market research", "competitor analysis",
  // Marketing
  "digital marketing", "content marketing", "email marketing", "social media", "performance marketing",
  "product marketing", "brand management", "search engine optimization", "google ad", "google ads", "google analytic",
  "meta ad", "meta ads", "facebook ad", "facebook ads", "paid media", "marketing automation", "content writing", "go-to-market",
  "a/b testing", "conversion rate optimization", "influencer marketing", "public relation",
  // Tech and data
  "machine learning", "deep learning", "data analysis", "data analytic", "data science", "data visualization",
  "data engineering", "data pipeline", "natural language processing", "computer vision", "software development",
  "web development", "front end", "back end", "full stack", "rest api", "unit testing", "test automation",
  "cloud computing", "system design", "version control", "spring boot", "power bi", "google sheet", "microsoft excel",
  "ms excel", "advanced excel", "ms office", "microsoft office", "funnel analysis", "cohort analysis",
  "problem solving", "problem-solving", "technical writing", "data modeling", "data modelling", "etl pipeline",
  // Operations, finance, people, design
  "project management", "product management", "agile methodology", "stakeholder management", "change management",
  "risk management", "quality assurance", "quality control", "technical support", "customer service",
  "customer support", "customer success", "supply chain", "inventory management", "vendor management",
  "financial modeling", "financial modelling", "financial analysis", "financial reporting", "accounts payable",
  "accounts receivable", "bank reconciliation", "tally erp", "gst filing", "tax compliance", "statutory compliance",
  "budget management", "cost reduction", "process improvement", "six sigma", "talent acquisition",
  "employee engagement", "performance management", "payroll processing", "ui design", "ux design",
  "user research", "user experience", "user interface", "graphic design", "motion graphic", "visual design",
  "interaction design", "usability testing",
].map((p) => p.split(" "));

/** Known single skills and tools (base form). Rank above words the post merely uses. */
const SKILLS = new Set([
  // Business tools and skills
  "excel", "salesforce", "hubspot", "zoho", "crm", "erp", "sap", "tally", "gst", "tds", "quickbooks", "xero",
  "negotiation", "communication", "presentation", "forecasting", "analysis", "pricing", "budgeting", "reporting",
  "seo", "sem", "ppc", "copywriting", "branding", "positioning", "analytic", "kpi", "okr", "jira", "asana",
  "trello", "slack", "canva", "figma", "photoshop", "illustrator", "indesign", "premiere", "sketch",
  "wireframing", "prototyping", "recruitment", "recruiting", "onboarding", "payroll", "compliance", "auditing",
  "accounting", "bookkeeping", "procurement", "logistic", "merchandising", "underwriting", "telecalling",
  "leadership", "mentoring", "coaching", "scrum", "agile", "kanban",
  // Tech
  "sql", "mysql", "postgresql", "mongodb", "redis", "python", "java", "javascript", "typescript", "react",
  "angular", "vue", "node.js", "nodejs", "django", "flask", "kotlin", "swift", "golang", "rust",
  "php", "laravel", "ruby", "c++", "c#", "dotnet", "html", "css", "tailwind", "aws", "azure", "gcp",
  "docker", "kubernete", "terraform", "linux", "git", "github", "devop", "api", "graphql", "tableau", "looker",
  "pandas", "numpy", "tensorflow", "pytorch", "spark", "hadoop", "airflow", "snowflake", "selenium", "cypress",
  "playwright", "android", "ios", "flutter", "bigquery", "redshift", "databricks", "dbt", "mixpanel", "amplitude",
  "metabase", "statistic", "sas", "spss", "stata", "matlab", "kafka", "jenkins", "firebase", "fastapi",
  "powerpoint", "ecommerce", "e-commerce", "etl",
  // Languages people list on Indian resumes
  "english", "hindi", "marathi", "tamil", "telugu", "kannada", "malayalam", "bengali", "gujarati", "punjabi",
  "urdu", "odia", "french", "german", "spanish", "arabic", "japanese",
]);

/** A few word families that should match each other ("negotiate" ↔ "negotiation"). */
const FAMILIES: [RegExp, string][] = [
  [/^negotiat/, "negotiation"],
  [/^communicat/, "communication"],
  [/^forecast/, "forecasting"],
  [/^analy[sz](e|ed|es|ing|is)$/, "analysis"],
];
const FAMILY_NAMES = new Set(FAMILIES.map(([, base]) => base));

/** Light base form: lowercase, drop plural "s", join word families. Tech words with symbols stay as they are. */
export function baseForm(word: string): string {
  const w = word.toLowerCase();
  for (const [re, base] of FAMILIES) if (re.test(w)) return base;
  if (w.length <= 3 || /[^a-z-]/.test(w)) return w;
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith("ss") || w.endsWith("us") || w.endsWith("is")) return w;
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

type Token = { raw: string; base: string; keep: boolean };

function words(text: string): Token[] {
  return text
    .toLowerCase()
    .replace(/\.net\b/g, " dotnet") // ".NET" would otherwise lose its dot below
    .replace(/[^a-z0-9+.#/\s-]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim().replace(/^[./-]+|[./-]+$/g, "")) // drop stray edge punctuation (e.g. sentence-final periods) but keep c++ / c# / node.js
    .filter((w) => w.length > 1 && !/^[0-9+.%/-]+$/.test(w)) // pure numbers like "5+" or "2-4" aren't keywords
    .map((raw) => ({ raw, base: baseForm(raw), keep: !STOPWORDS.has(raw) && !PLACES.has(raw) }));
}

/** Acronyms written in capitals in the post (CRM, SQL, KPI) - likely tools or skills. */
function acronymsIn(text: string): Set<string> {
  return new Set([...text.matchAll(/\b[A-Z][A-Z0-9&]{1,5}\b/g)].map((m) => m[0].toLowerCase()));
}

function isToolLike(raw: string, acronyms: Set<string>): boolean {
  return acronyms.has(raw) || /[0-9+#.]/.test(raw);
}

/** Where each known phrase appears in a token list (by start index). */
function phraseHits(tokens: Token[]): { phrase: string[]; at: number }[] {
  const hits: { phrase: string[]; at: number }[] = [];
  for (let i = 0; i < tokens.length; i++) {
    for (const phrase of PHRASES) {
      if (phrase.every((p, j) => tokens[i + j]?.base === p)) hits.push({ phrase, at: i });
    }
  }
  return hits;
}

type Keyword = { key: string; label: string; parts: string[] };

const MAX_KEYWORDS = 20;

/**
 * Most posts open with a title line: "Senior Data Analyst - Swiggy, Bengaluru".
 * Its plain words are the job title, the hiring company and the place, none
 * of which belong in a list of skills to add (title matching is its own
 * check), so they're skipped there. Known skills in it still count.
 * Only applies when there's more to the post after that line.
 */
function titleLineWordCount(jobDescription: string): number {
  const text = jobDescription.trim();
  const newline = text.indexOf("\n");
  let end = newline >= 0 && newline <= 160 ? newline : -1;
  if (end < 0) {
    const sentence = text.search(/[.!?|]\s/);
    if (sentence >= 0 && sentence <= 120) end = sentence;
  }
  if (end < 0) return 0;
  const rest = text.slice(end + 1).trim();
  if (rest.split(/\s+/).length < 8) return 0;
  return words(text.slice(0, end)).length;
}

/**
 * The hiring company's own name ("Zomato is hiring", "Join Swiggy", "About
 * Razorpay", "Flipkart's") is never a keyword to add to a resume.
 */
function companyNames(jobDescription: string): Set<string> {
  const names = new Set<string>();
  const NAME = "([A-Z][A-Za-z0-9&.-]{1,30})";
  const patterns = [
    new RegExp(`\\b(?:at|join|about|why)\\s+${NAME}`, "g"),
    new RegExp(`\\b${NAME}\\s+(?:is hiring|is looking|is seeking|offers|is a|is an|is one|was founded)\\b`, "g"),
    new RegExp(`\\b${NAME}['’]s\\b`, "g"),
  ];
  for (const re of patterns) for (const m of jobDescription.matchAll(re)) names.add(m[1].toLowerCase().replace(/[.]+$/, ""));
  return names;
}

function extract(jobDescription: string, limit = MAX_KEYWORDS): Keyword[] {
  const tokens = words(jobDescription);
  const acronyms = acronymsIn(jobDescription);
  const hits = phraseHits(tokens);
  const titleWords = titleLineWordCount(jobDescription);
  const companies = companyNames(jobDescription);

  // Tokens that are part of a matched phrase count toward the phrase, not on their own.
  const covered = new Set<number>();
  for (const h of hits) h.phrase.forEach((_, j) => covered.add(h.at + j));

  const found = new Map<string, Keyword & { score: number; first: number }>();
  const bump = (kw: Keyword, at: number, bonus: number) => {
    const existing = found.get(kw.key);
    if (existing) existing.score += 1;
    else found.set(kw.key, { ...kw, score: 1 + bonus, first: at });
  };

  for (const h of hits) {
    const label = tokens.slice(h.at, h.at + h.phrase.length).map((t) => t.raw).join(" ");
    bump({ key: h.phrase.join(" "), label, parts: h.phrase }, h.at, 4);
  }
  tokens.forEach((t, i) => {
    if (!t.keep || covered.has(i)) return;
    const known = SKILLS.has(t.base) || isToolLike(t.raw, acronyms);
    if (!known && (i < titleWords || companies.has(t.raw))) return;
    // Show a word family by its skill name ("negotiation", not "negotiate").
    const label = FAMILY_NAMES.has(t.base) ? t.base : t.raw;
    bump({ key: t.base, label, parts: [t.base] }, i, known ? 3 : 0);
  });

  return [...found.values()]
    .sort((a, b) => b.score - a.score || a.first - b.first)
    .slice(0, limit)
    .map(({ key, label, parts }) => ({ key, label, parts }));
}

/**
 * The keywords a job post is looking for, most important first: known
 * phrases and skills, then other words it repeats, then the rest.
 */
export function extractKeywords(jobDescription: string, limit = MAX_KEYWORDS): string[] {
  return extract(jobDescription, limit).map((k) => k.label);
}

/** The pieces of a resume that are read separately: summary, each bullet, each skill... */
function resumeSegments(resume: ResumeData): string[] {
  const parts: string[] = [resume.summary, ...resume.skills];
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
  return parts.filter((p) => p && p.trim());
}

function segmentBases(segments: string[]): Set<string>[] {
  return segments.map((s) => new Set(words(s).map((t) => t.base)));
}

function found(kw: Keyword, segments: Set<string>[]): boolean {
  // A phrase counts when all its words show up in the same bullet, skill or line.
  return segments.some((seg) => kw.parts.every((p) => seg.has(p)));
}

/** Whether a keyword (as returned by extractKeywords) appears in a piece of text. */
export function keywordInText(keyword: string, text: string): boolean {
  const parts = words(keyword).map((t) => t.base);
  if (!parts.length) return false;
  return found({ key: parts.join(" "), label: keyword, parts }, segmentBases([text]));
}

export type AtsResult = {
  score: number; // 0-100
  matchedKeywords: string[];
  missingKeywords: string[];
  totalKeywords: number;
};

export function scoreResumeAgainstJob(input: ResumeData, jobDescription: string): AtsResult {
  const resume = plainResume(input);
  const keywords = extract(jobDescription);
  const segments = segmentBases(resumeSegments(resume));

  const matched = keywords.filter((k) => found(k, segments));
  const missing = keywords.filter((k) => !found(k, segments));

  const score = keywords.length === 0
    ? 100
    : Math.round((matched.length / keywords.length) * 100);

  return {
    score,
    matchedKeywords: matched.map((k) => k.label),
    missingKeywords: missing.map((k) => k.label),
    totalKeywords: keywords.length,
  };
}
