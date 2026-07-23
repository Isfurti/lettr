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

function parseJsonArraySafely(text: string): string[] {
  const cleaned = text.replace(/```json|```/g, "").trim();
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
