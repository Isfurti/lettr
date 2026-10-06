import Anthropic from "@anthropic-ai/sdk";
import type { ResumeData } from "./types";
import { MODELS, usageFromApi, type ModelId, type TokenUsage } from "./ai-costs";

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

/**
 * Turn a rough, unpolished bullet point into 3 achievement-focused,
 * ATS-friendly resume bullet options.
 */
export async function polishBullet(params: {
  roughBullet: string;
  role: string;
  targetJobDescription?: string;
}): Promise<AiResult<string[]>> {
  const prompt = `You are an expert resume writer. Rewrite the following rough work
accomplishment into 3 distinct, polished resume bullet point options for a "${params.role}" role.

Rules for each bullet:
- Start with a strong action verb
- Quantify impact with a number or metric if one is plausible (do not invent
  specific figures that weren't implied; use "X%" style placeholders only if
  truly unknown, otherwise keep it qualitative)
- Keep each bullet to one line (max ~220 characters)
- No first-person pronouns
- ATS-friendly plain text, no special characters beyond standard punctuation
${params.targetJobDescription ? `- Where natural, favor terminology consistent with this target job description:\n${params.targetJobDescription.slice(0, 1500)}` : ""}

Rough accomplishment: "${params.roughBullet}"

Respond ONLY with a JSON array of exactly 3 strings, no preamble, no markdown fences.`;

  const { text, usage } = await complete(MODEL_FAST, 500, prompt);
  return { value: parseJsonArraySafely(text), model: MODEL_FAST, usage };
}

/**
 * The cover letter prompt. Exported so the route can tell when the resume and
 * job post are unchanged (same prompt = same letter) and reuse the saved one.
 */
export function buildCoverLetterPrompt(params: { resume: ResumeData; jobDescription: string; companyName?: string }): string {
  const { resume, jobDescription, companyName } = params;

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
Do not invent specific achievements not present in the resume summary. Professional but warm tone.
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
}): Promise<AiResult<string>> {
  const { employeeName, companyName, jobTitle, lastDay, reason, tone = "neutral" } = params;

  const prompt = `Write a professional resignation letter with these details:
- Employee name: ${employeeName}
- Job title: ${jobTitle}
- Company: ${companyName}
- Last day of work: ${lastDay}
${reason ? `- Reason to briefly mention (optional, keep it graceful): ${reason}` : ""}

Tone: ${tone === "warm" ? "warm and appreciative, express gratitude for the opportunity" : tone === "brief" ? "brief and to the point, 3-4 sentences total" : "professional and neutral"}.

Rules:
- Standard business letter structure
- State the resignation clearly in the first paragraph, including the last working day
- Do not badmouth the company or manager, regardless of the reason given
- End with an offer to help with the transition
- Output plain text only, no markdown, no placeholders left unfilled

Sign off with the employee's name.`;

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
  const { experience, skills, targetRole } = params;

  const experienceText = experience
    .map((e) => `${e.role} at ${e.company} (${e.startDate}–${e.endDate}): ${e.bullets.join("; ")}`)
    .join("\n");

  const prompt = `You are an expert resume writer. Write 3 distinct professional summary options
(2-3 sentences each, under 400 characters) for a resume${targetRole ? ` targeting a "${targetRole}" role` : ""}.

Base it on this experience:
${experienceText || "(no experience listed yet - write a summary suitable for someone early in their career, based on the skills below)"}

Skills: ${skills.join(", ") || "(none listed)"}

Rules:
- Third person is not needed - write as the candidate's own voice, no "I" pronoun needed either (resume style, e.g. "Results-driven engineer with...")
- Lead with role/seniority, not a generic adjective
- Mention 1-2 concrete strengths grounded in the experience given
- No buzzword soup - avoid stacking more than one of "passionate", "dynamic", "synergy", "results-driven" per summary
- Plain text only

Respond ONLY with a JSON array of exactly 3 strings, no preamble, no markdown fences.`;

  const { text, usage } = await complete(MODEL_FAST, 600, prompt);
  return { value: parseJsonArraySafely(text), model: MODEL_FAST, usage };
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
