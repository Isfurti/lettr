import Anthropic from "@anthropic-ai/sdk";
import type { ResumeData } from "./types";
import { MODELS, addUsage, usageFromApi, type ModelId, type TokenUsage } from "./ai-costs";
import { plainResume, stripRich } from "./rich-text";
import { HONESTY_RULES, blankInventedNumbers, guardRewrites, numbersIn, retryReminder, yearsOfExperience } from "./ai-honesty";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env.local (local dev) or your hosting provider's environment variables (production) to enable AI generation."
    );
  }
  return new Anthropic({ apiKey });
}

// Two tiers, routed by task complexity - not everything needs the same
// model. MODEL (Sonnet) is kept for tasks where output quality genuinely
// benefits from stronger reasoning: cover letters (persuasive writing
// tailored to a specific job) and the AI Agent (lib/ai-agent.ts, tool-use
// reasoning across multiple steps). MODEL_FAST (Haiku) handles everything
// else - bullet rewriting, summaries, resignation letters, resume
// extraction, and review analysis are all well-defined, mostly mechanical
// tasks (rewrite this, extract that, classify this) that don't need the
// expensive model to do well, and are also the highest-volume calls -
// exactly where routing saves the most in aggregate.
//
// Cover letters are the exception that follows the plan: free-plan letters
// use MODEL_FAST, Pro letters use MODEL (see coverLetterModel in ai-costs.ts).
const MODEL = MODELS.sonnet;
const MODEL_FAST = MODELS.haiku;

/** Every AI call reports which model ran and the tokens it used, for cost tracking. */
export type AiResult<T> = { value: T; model: ModelId; usage: TokenUsage };

function textOf(response: Anthropic.Message): string {
  return response.content.map((block) => (block.type === "text" ? block.text : "")).join("");
}

async function complete(model: ModelId, maxTokens: number, prompt: string): Promise<{ text: string; usage: TokenUsage }> {
  const response = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });
  return { text: textOf(response), usage: usageFromApi(response.usage) };
}

/** Shown when even the retry only came back with options that made things up. */
const NO_HONEST_OPTIONS =
  "Couldn't write a rewrite that sticks to your facts this time. Add a detail about what changed because of you, then try again.";

/**
 * Asks for 3 options, then checks them against what the person actually
 * wrote (lib/ai-honesty.ts). If fewer than 2 survive, asks once more with a
 * reminder. Never returns an option that adds facts they didn't give.
 */
async function honestOptions(prompt: string, maxTokens: number, source: string, extraNumbers: (string | number)[] = []) {
  const first = await complete(MODEL_FAST, maxTokens, prompt);
  let usage = first.usage;
  const firstPass = guardRewrites(source, parseJsonArraySafely(first.text), extraNumbers);
  let kept = firstPass.kept;
  if (kept.length < 2) {
    const second = await complete(MODEL_FAST, maxTokens, prompt + retryReminder(firstPass.dropped));
    usage = addUsage(usage, second.usage);
    const again = guardRewrites(source, parseJsonArraySafely(second.text), extraNumbers);
    kept = [...kept, ...again.kept.filter((o) => !kept.some((k) => k.toLowerCase() === o.toLowerCase()))];
  }
  if (kept.length === 0) throw new Error(NO_HONEST_OPTIONS);
  return { options: kept.slice(0, 3), usage };
}

/**
 * Turn a rough, unpolished bullet point into 3 resume bullet options that
 * use only the person's own facts, with [X] blanks where a result would help.
 */
export async function polishBullet(params: {
  roughBullet: string;
  role: string;
  targetJobDescription?: string;
}): Promise<AiResult<string[]>> {
  params = { ...params, roughBullet: stripRich(params.roughBullet) };
  const prompt = `You are an expert resume writer. Rewrite the rough work point below into 3 distinct
resume bullet options for a "${params.role}" role.

${HONESTY_RULES}

How to write each bullet:
- Start with a plain action verb.
- Turn duties into results using only the person's own facts. If the result isn't given, add a blank
  they can fill in, e.g. "Grew sales by [X]% in [time period]" or "Handled [number] client accounts".
- One line each (under about 220 characters), no first-person pronouns, plain text with standard punctuation.
${
  params.targetJobDescription
    ? `- A target job post is below. Reuse its wording only for things the rough point already says.
  Never add a skill, tool or duty from the job post that isn't in the rough point.

Target job post:
${params.targetJobDescription.slice(0, 1500)}
`
    : ""
}
Rough point: "${params.roughBullet}"

Respond ONLY with a JSON array of exactly 3 strings, no preamble, no markdown fences.`;

  // Only the person's own words count as facts - not the job post.
  const source = `${params.roughBullet}\n${params.role}`;
  const { options, usage } = await honestOptions(prompt, 500, source);
  return { value: options, model: MODEL_FAST, usage };
}

/**
 * The cover letter prompt. Exported so the route can tell when the resume and
 * job post are unchanged (same prompt = same letter) and reuse the saved one.
 */
export function buildCoverLetterPrompt(params: { resume: ResumeData; jobDescription: string; companyName?: string }): string {
  const { jobDescription, companyName } = params;
  const resume = plainResume(params.resume);

  const resumeSummary = `
Name: ${resume.contact.fullName}
Summary: ${resume.summary}
Experience: ${resume.experience
    .map((e) => `${e.role} at ${e.company} (${e.startDate}–${e.endDate}): ${e.bullets.join("; ")}`)
    .join("\n")}
Skills: ${resume.skills.join(", ")}
`.trim();

  return `Write a concise, compelling cover letter (3-4 short paragraphs, under 320 words)
for the candidate below, tailored to the target job description.
${companyName ? `The target company is "${companyName}".` : ""}
Do not invent achievements, numbers, employers or skills that aren't in the resume summary below. Professional but warm tone.
Output plain text only, no markdown, no placeholders like [Company Name] left unfilled if the company is known.

CANDIDATE RESUME SUMMARY:
${resumeSummary}

TARGET JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}`;
}

/** Writes a cover letter from a prompt made by buildCoverLetterPrompt. */
export async function generateCoverLetter(prompt: string, model: ModelId = MODEL): Promise<AiResult<string>> {
  const { text, usage } = await complete(model, 800, prompt);
  return { value: text.trim(), model, usage };
}

/**
 * Generate a professional resignation letter from basic details the user provides.
 */
export async function generateResignationLetter(params: {
  employeeName: string;
  companyName: string;
  jobTitle: string;
  lastDay: string;
  reason?: string;
  tone?: "warm" | "neutral" | "brief";
  managerName?: string;
  email?: string;
  phone?: string;
  /** The letter's date line. Defaults to today in India time. */
  today?: string;
}): Promise<AiResult<string>> {
  const { employeeName, companyName, jobTitle, lastDay, reason, tone = "neutral", managerName, email, phone } = params;
  const today =
    params.today ??
    new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" });
  const contactLine = [email, phone].filter(Boolean).join(" · ");

  const prompt = `Write a professional resignation letter with these details:
- Employee name: ${employeeName}
- Job title: ${jobTitle}
- Company: ${companyName}
- Last day of work: ${lastDay}
- Today's date: ${today}
${managerName ? `- Addressed to: ${managerName}` : ""}
${reason ? `- Reason to briefly mention (optional, keep it graceful): ${reason}` : ""}

Tone: ${tone === "warm" ? "warm and appreciative, express gratitude for the opportunity" : tone === "brief" ? "brief and to the point, 3-4 sentences total" : "professional and neutral"}.

Layout, exactly in this order:
1. The date line: ${today}
2. A blank line, then "Dear ${managerName || "[Manager's name]"},"
3. The letter body in short paragraphs
4. A sign-off ("Sincerely," or "Warm regards,"), then the employee's name${contactLine ? `, then this contact line: ${contactLine}` : ""}

Rules:
- State the resignation clearly in the first paragraph, including the job title and the last working day
- Do not badmouth the company or manager, regardless of the reason given
- End with an offer to help with the transition
- No postal address blocks and no other [bracketed] fields${managerName ? "" : " apart from [Manager's name] in the greeting"} - use only the details above
- Plain text only, no markdown`;

  const { text, usage } = await complete(MODEL_FAST, 600, prompt);
  return { value: text.trim(), model: MODEL_FAST, usage };
}

/**
 * Generate 3 professional summary options from the candidate's experience and skills.
 */
export async function generateSummary(params: {
  experience: ResumeData["experience"];
  skills: string[];
  targetRole?: string;
}): Promise<AiResult<string[]>> {
  const { skills, targetRole } = params;
  const experience = params.experience.map((e) => ({ ...e, bullets: e.bullets.map(stripRich) }));

  const experienceText = experience
    .map((e) => `${e.role} at ${e.company} (${e.startDate}–${e.endDate}): ${e.bullets.join("; ")}`)
    .join("\n");
  const years = yearsOfExperience(experience);

  const prompt = `You are an expert resume writer. Write 3 distinct professional summary options
(2-3 sentences each, under 400 characters) for a resume${targetRole ? ` targeting a "${targetRole}" role` : ""}.

Base it on this experience:
${experienceText || "(no experience listed yet - write a summary suitable for someone early in their career, based on the skills below)"}
${years ? `Total experience: about ${years} years (from the dates above).` : ""}

Skills: ${skills.join(", ") || "(none listed)"}

${HONESTY_RULES}

How to write each summary:
- Resume style: no "I" and no third person (start like "Sales executive who...").
- Lead with role/seniority, not a generic adjective.
- Mention 1-2 concrete strengths taken from the experience or skills above.
- Say what the person does and is good at - not what they're looking for (no "seeking a role where I can grow").
- Plain text only.

Respond ONLY with a JSON array of exactly 3 strings, no preamble, no markdown fences.`;

  const source = [experienceText, skills.join(", "), targetRole ?? ""].join("\n");
  const { options, usage } = await honestOptions(prompt, 600, source, years ? [years] : []);
  return { value: options, model: MODEL_FAST, usage };
}

/**
 * Extracts structured resume data from raw text pulled out of an uploaded
 * PDF/DOCX/TXT resume. Returns data matching ResumeData - never invents
 * experience or education entries that aren't clearly present in the text.
 */
export const IMPORT_MODEL = MODEL_FAST;

export async function extractResumeFromText(rawText: string): Promise<AiResult<ResumeData>> {

  const prompt = `Extract structured resume data from the following resume text. This text was
mechanically extracted from a PDF or Word document, so formatting/line breaks may be imperfect -
use your judgment to reconstruct the correct structure.

Rules:
- Only extract information that is actually present in the text. Do not invent, guess, or
  hallucinate any experience, education, dates, or skills that aren't there.
- If a field isn't present (e.g. no phone number, no LinkedIn), omit it or use an empty string.
- Preserve the person's actual bullet point wording - do not rewrite or improve it, this is an
  import, not a rewrite.
- Dates should stay in whatever format they appear in the original (don't reformat).
- If this is a LinkedIn profile saved as PDF, ignore "Page X of Y" markers and the "Contact" and
  "Top Skills" labels; use the headline or "Summary" section as the summary, and put "Top Skills"
  and "Skills" entries into skills.

Resume text:
"""
${rawText.slice(0, 15000)}
"""

Respond ONLY with a JSON object matching this exact shape, no preamble, no markdown fences:
{
  "contact": { "fullName": string, "email": string, "phone": string, "location": string, "linkedin": string, "website": string },
  "summary": string,
  "experience": [{ "role": string, "company": string, "startDate": string, "endDate": string, "bullets": string[] }],
  "education": [{ "school": string, "degree": string, "startDate": string, "endDate": string }],
  "skills": string[],
  "projects": [{ "name": string, "link": string, "description": string }],
  "certifications": [{ "name": string, "issuer": string, "date": string }],
  "languages": string[],
  "achievements": string[]
}
Use empty arrays for projects, certifications, languages or achievements if the resume has none.`;

  const { text, usage } = await complete(MODEL_FAST, 4000, prompt);

  const cleaned = text.replace(/```json|```/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Couldn't parse the resume - the file may not contain readable resume text.");
  }

  return { value: normalizeExtractedResume(parsed), model: MODEL_FAST, usage };
}

/** Also used on a reused import, which gives every entry fresh ids. */
export function normalizeExtractedResume(raw: unknown): ResumeData {
  const r = raw as Record<string, unknown>;
  const contact = (r.contact as Record<string, unknown>) ?? {};
  const experience = Array.isArray(r.experience) ? r.experience : [];
  const education = Array.isArray(r.education) ? r.education : [];

  return {
    contact: {
      fullName: String(contact.fullName ?? ""),
      email: String(contact.email ?? ""),
      phone: contact.phone ? String(contact.phone) : undefined,
      location: contact.location ? String(contact.location) : undefined,
      linkedin: contact.linkedin ? String(contact.linkedin) : undefined,
      website: contact.website ? String(contact.website) : undefined,
    },
    summary: String(r.summary ?? ""),
    experience: experience.map((e) => {
      const exp = e as Record<string, unknown>;
      return {
        id: crypto.randomUUID(),
        role: String(exp.role ?? ""),
        company: String(exp.company ?? ""),
        startDate: String(exp.startDate ?? ""),
        endDate: String(exp.endDate ?? ""),
        bullets: Array.isArray(exp.bullets) ? exp.bullets.map(String) : [],
      };
    }),
    education: education.map((e) => {
      const edu = e as Record<string, unknown>;
      return {
        id: crypto.randomUUID(),
        school: String(edu.school ?? ""),
        degree: String(edu.degree ?? ""),
        startDate: String(edu.startDate ?? ""),
        endDate: String(edu.endDate ?? ""),
      };
    }),
    skills: Array.isArray(r.skills) ? r.skills.map(String) : [],
    projects: (Array.isArray(r.projects) ? r.projects : []).map((p) => {
      const proj = p as Record<string, unknown>;
      return {
        id: crypto.randomUUID(),
        name: String(proj.name ?? ""),
        link: proj.link ? String(proj.link) : "",
        description: String(proj.description ?? ""),
      };
    }),
    certifications: (Array.isArray(r.certifications) ? r.certifications : []).map((c) => {
      const cert = c as Record<string, unknown>;
      return {
        id: crypto.randomUUID(),
        name: String(cert.name ?? ""),
        issuer: cert.issuer ? String(cert.issuer) : "",
        date: cert.date ? String(cert.date) : "",
      };
    }),
    languages: Array.isArray(r.languages) ? r.languages.map(String) : [],
    achievements: Array.isArray(r.achievements) ? r.achievements.map(String) : [],
  };
}

export type ReviewAnalysis = {
  sentiment: "positive" | "neutral" | "negative" | "mixed";
  likes: string[];
  dislikes: string[];
  reply: string;
};

export const REVIEW_MODEL = MODEL_FAST;
const REVIEW_MAX_TOKENS = 700;

/** The request for one review analysis. Shared by the instant path and the batch job. */
export function reviewAnalysisRequest(rating: number, content: string): Anthropic.MessageCreateParamsNonStreaming {
  const prompt = `A user left this review of Lettr, an AI resume builder, with a star rating of ${rating}/5:

"${content}"

Analyze it and respond with ONLY a JSON object, no preamble, no markdown fences, in this exact shape:
{
  "sentiment": "positive" | "neutral" | "negative" | "mixed",
  "likes": string[],
  "dislikes": string[],
  "reply": string
}

Rules:
- "likes" and "dislikes" should be short, specific phrases pulled from what they actually said - not
  generic categories. If they didn't mention any dislikes, return an empty array - don't invent one to
  seem balanced.
- "reply" should be a short (2-4 sentence), warm, specific reply as if from the Lettr team - reference
  the actual things they mentioned (praise or complaints) rather than a generic "thanks for your
  feedback!" message. If they raised a real problem, acknowledge it honestly and don't over-promise a
  fix timeline. Don't be sycophantic or over-the-top - genuine and brief.`;
  return { model: REVIEW_MODEL, max_tokens: REVIEW_MAX_TOKENS, messages: [{ role: "user", content: prompt }] };
}

/** Turns the model's answer into a ReviewAnalysis, with safe defaults if it isn't clean JSON. */
export function parseReviewAnalysis(text: string): ReviewAnalysis {
  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    return {
      sentiment: ["positive", "neutral", "negative", "mixed"].includes(parsed.sentiment) ? parsed.sentiment : "neutral",
      likes: Array.isArray(parsed.likes) ? parsed.likes.map(String) : [],
      dislikes: Array.isArray(parsed.dislikes) ? parsed.dislikes.map(String) : [],
      reply: typeof parsed.reply === "string" ? parsed.reply : "Thanks for sharing your feedback with us.",
    };
  } catch {
    return { sentiment: "neutral", likes: [], dislikes: [], reply: "Thanks for sharing your feedback with us." };
  }
}

/**
 * Analyzes a user's review straight away (likes/dislikes for the admin
 * "what users don't like" view, plus a specific reply). Normally reviews go
 * through the cheaper batch job in lib/review-batch.ts; this is the fallback.
 */
export async function analyzeReview(rating: number, content: string): Promise<AiResult<ReviewAnalysis>> {
  const response = await getClient().messages.create(reviewAnalysisRequest(rating, content));
  return { value: parseReviewAnalysis(textOf(response)), model: REVIEW_MODEL, usage: usageFromApi(response.usage) };
}

export { getClient as getAnthropicClient };

function parseJsonArraySafely(text: string): string[] {  const cleaned = text.replace(/```json|```/g, "").trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    // fall through to line-based fallback below
  }
  // Fallback: split into lines if the model didn't return clean JSON
  return cleaned
    .split("\n")
    .map((l) => l.replace(/^[-*\d.]+\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 3);
}

// ---------- Interview practice ----------

export const INTERVIEW_MODEL = MODEL_FAST;

export type GeneratedQuestion = { question: string; kind: "behavioural" | "role" | "resume" };

/** Six practice questions for a role: two behavioural, three about the job itself, one about the candidate's own resume. */
export async function generateInterviewQuestions(params: {
  role: string;
  company?: string;
  jobPost?: string;
  resume?: ResumeData | null;
}): Promise<AiResult<GeneratedQuestion[]>> {
  const r = params.resume ? plainResume(params.resume) : null;
  const background = r
    ? `Candidate background:
Summary: ${r.summary}
Experience: ${r.experience.map((e) => `${e.role} at ${e.company}: ${e.bullets.slice(0, 3).join("; ")}`).join("\n")}
Skills: ${r.skills.join(", ")}`
    : "No resume given.";
  const prompt = `You are an experienced interviewer. Write 6 realistic interview questions for a "${params.role}" role${
    params.company ? ` at ${params.company}` : ""
  }.

- 2 behavioural questions (teamwork, conflict, failure, ownership) - kind "behavioural"
- 3 questions about the actual skills and situations of this role - kind "role"
- 1 question that digs into something specific from the candidate's background - kind "resume" (if there is no background, make it a role question)

Keep each question to one or two sentences, in plain English, the way a real interviewer in India or abroad would ask it.
${params.jobPost ? `Job post:\n${params.jobPost.slice(0, 3000)}\n` : ""}
${background.slice(0, 3000)}

Respond ONLY with a JSON array like [{"question": "...", "kind": "behavioural"}], no preamble, no markdown fences.`;
  const { text, usage } = await complete(MODEL_FAST, 900, prompt);
  let list: GeneratedQuestion[] = [];
  try {
    const parsed = JSON.parse(text.replace(/```json|```/g, "").trim());
    if (Array.isArray(parsed)) {
      list = parsed
        .filter((q) => q && typeof q.question === "string" && q.question.trim())
        .slice(0, 8)
        .map((q) => ({
          question: String(q.question).trim(),
          kind: q.kind === "behavioural" || q.kind === "resume" ? q.kind : "role",
        }));
    }
  } catch {
    // fall through
  }
  if (list.length === 0) throw new Error("Couldn't write questions this time. Please try again.");
  return { value: list, model: MODEL_FAST, usage };
}

export type AnswerFeedback = { score: number; strengths: string[]; improve: string[]; better: string };

/** Honest, specific feedback on one practice answer, with a stronger version to learn from. */
export async function interviewFeedback(params: { role: string; question: string; answer: string }): Promise<AiResult<AnswerFeedback>> {
  const prompt = `You are a supportive but honest interview coach. A candidate for a "${params.role}" role answered this interview question.

Question: ${params.question}

Answer: """${params.answer.slice(0, 4000)}"""

Give feedback as JSON only, no preamble, no markdown fences:
{
  "score": number from 1 to 10,
  "strengths": up to 3 short, specific things they did well (empty array if none),
  "improve": up to 3 short, specific, actionable fixes (e.g. "Say what the result was, with a number"),
  "better": a stronger answer of 80-150 words in the first person, using the STAR shape (situation, task, action, result), built only from what they said - write [your number] or [your example] where they need to add a real detail; never invent facts
}
Judge like a real interviewer: a vague or very short answer scores 3-5, a clear STAR answer with a measurable result scores 8+.`;
  const { text, usage } = await complete(MODEL_FAST, 900, prompt);
  try {
    const p = JSON.parse(text.replace(/```json|```/g, "").trim());
    const list = (x: unknown) => (Array.isArray(x) ? x.map(String).slice(0, 3) : []);
    return {
      value: {
        score: Math.min(10, Math.max(1, Math.round(Number(p.score) || 5))),
        strengths: list(p.strengths),
        improve: list(p.improve),
        better: typeof p.better === "string" ? p.better : "",
      },
      model: MODEL_FAST,
      usage,
    };
  } catch {
    throw new Error("Couldn't read the feedback this time. Please try again.");
  }
}

// ---------- ATS score analyst ----------

export type AnalystAdvice = { summary: string; fixes: { title: string; why: string; example: string }[] };

/**
 * The "ask the analyst" step: a plain-English read of the ATS report with
 * concrete rewrites, built only from what's in the resume.
 */
export async function atsAnalystAdvice(params: {
  resume: ResumeData;
  jobPost?: string;
  score: number;
  issues: string[];
  missingKeywords: string[];
}): Promise<AiResult<AnalystAdvice>> {
  const r = plainResume(params.resume);
  const resumeText = `Summary: ${r.summary}
Experience:
${r.experience.map((e) => `- ${e.role} at ${e.company} (${e.startDate}–${e.endDate})\n${e.bullets.map((b) => `  • ${b}`).join("\n")}`).join("\n")}
Education: ${r.education.map((e) => `${e.degree}, ${e.school}`).join("; ")}
Skills: ${r.skills.join(", ")}`;
  const prompt = `You are an ATS (applicant tracking system) and recruiting expert reviewing a resume. Its automatic ATS score is ${params.score}/100.

Problems the checker found:
${params.issues.map((i) => `- ${i}`).join("\n") || "- none"}
${params.missingKeywords.length ? `Job keywords missing from the resume: ${params.missingKeywords.slice(0, 15).join(", ")}` : ""}

RESUME:
${resumeText.slice(0, 6000)}
${params.jobPost ? `\nJOB POST:\n${params.jobPost.slice(0, 3500)}` : ""}

Write JSON only, no preamble, no markdown fences:
{
  "summary": "2-3 plain sentences: how this resume will fare with ATS and recruiters for ${params.jobPost ? "this job" : "the roles it targets"}, and the single biggest lever",
  "fixes": [ up to 4 items, most valuable first, each { "title": "short action", "why": "one sentence", "example": "a concrete rewrite of one of THEIR bullets or their summary, or the exact line to add" } ]
}
Rules:
- Don't state or predict a score or score range - the person already sees the score above. Talk about what to change.
- Never invent employers, numbers, skills, tools, duties, teams, people or outcomes. An example may only rephrase facts already in the resume; where a number or detail would help, write [your number] or [your detail] instead.
- Only suggest keywords the resume suggests they genuinely have, or tell them to add a keyword only if it's true for them.
- Ignore the hiring company's own name and generic words when talking about keywords.
- Match the resume's spelling style (British "analysed" or American "analyzed").
- Plain English, no jargon, no markdown.`;
  const { text, usage } = await complete(MODEL_FAST, 1200, prompt);
  // Same backstop as the rewrite tools: a figure the resume doesn't contain becomes a blank.
  const allowed = numbersIn(resumeText);
  try {
    const p = JSON.parse(text.replace(/```json|```/g, "").trim());
    const fixes = Array.isArray(p.fixes)
      ? p.fixes.slice(0, 4).map((f: Record<string, unknown>) => ({
          title: String(f.title ?? ""),
          why: String(f.why ?? ""),
          example: blankInventedNumbers(String(f.example ?? ""), allowed),
        }))
      : [];
    return { value: { summary: String(p.summary ?? ""), fixes }, model: MODEL_FAST, usage };
  } catch {
    throw new Error("The analyst couldn't finish this time. Please try again.");
  }
}
