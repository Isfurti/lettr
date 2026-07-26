import Anthropic from "@anthropic-ai/sdk";
import type { ResumeData } from "./types";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to your .env.local to enable AI generation."
    );
  }
  return new Anthropic({ apiKey });
}

const MODEL = "claude-sonnet-4-6";

/**
 * Turn a rough, unpolished bullet point into 3 achievement-focused,
 * ATS-friendly resume bullet options.
 */
export async function polishBullet(params: {
  roughBullet: string;
  role: string;
  targetJobDescription?: string;
}): Promise<string[]> {
  const client = getClient();

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

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 500,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  return parseJsonArraySafely(text);
}

/**
 * Generate a tailored cover letter from resume data + a target job description.
 */
export async function generateCoverLetter(params: {
  resume: ResumeData;
  jobDescription: string;
  companyName?: string;
}): Promise<string> {
  const client = getClient();
  const { resume, jobDescription, companyName } = params;

  const resumeSummary = `
Name: ${resume.contact.fullName}
Summary: ${resume.summary}
Experience: ${resume.experience
    .map((e) => `${e.role} at ${e.company} (${e.startDate}–${e.endDate}): ${e.bullets.join("; ")}`)
    .join("\n")}
Skills: ${resume.skills.join(", ")}
`.trim();

  const prompt = `Write a concise, compelling cover letter (3-4 short paragraphs, under 320 words)
for the candidate below, tailored to the target job description.
${companyName ? `The target company is "${companyName}".` : ""}
Do not invent specific achievements not present in the resume summary. Professional but warm tone.
Output plain text only, no markdown, no placeholders like [Company Name] left unfilled if the company is known.

CANDIDATE RESUME SUMMARY:
${resumeSummary}

TARGET JOB DESCRIPTION:
${jobDescription.slice(0, 3000)}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 800,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
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
}): Promise<string> {
  const client = getClient();
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

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  return response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("")
    .trim();
}

/**
 * Generate 3 professional summary options from the candidate's experience and skills.
 */
export async function generateSummary(params: {
  experience: ResumeData["experience"];
  skills: string[];
  targetRole?: string;
}): Promise<string[]> {
  const client = getClient();
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

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  return parseJsonArraySafely(text);
}

/**
 * Extracts structured resume data from raw text pulled out of an uploaded
 * PDF/DOCX/TXT resume. Returns data matching ResumeData - never invents
 * experience or education entries that aren't clearly present in the text.
 */
export async function extractResumeFromText(rawText: string): Promise<ResumeData> {
  const client = getClient();

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
  "skills": string[]
}`;

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content
    .map((block) => (block.type === "text" ? block.text : ""))
    .join("");

  const cleaned = text.replace(/```json|```/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error("Couldn't parse the resume - the file may not contain readable resume text.");
  }

  return normalizeExtractedResume(parsed);
}

function normalizeExtractedResume(raw: unknown): ResumeData {
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
  };
}

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
