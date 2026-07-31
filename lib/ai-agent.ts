import Anthropic from "@anthropic-ai/sdk";
import type { ResumeData, ExperienceEntry, EducationEntry } from "./types";

function getClient() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not set. Add it to your .env.local (local dev) or your hosting provider's environment variables (production) to enable the AI Resume Agent.");
  }
  return new Anthropic({ apiKey });
}

const MODEL = "claude-sonnet-4-6";
const MAX_TOOL_ITERATIONS = 5;

// ---------- Tool schema ----------

const TOOLS: Anthropic.Tool[] = [
  {
    name: "update_contact",
    description: "Update one or more contact fields. Only pass the fields that should change.",
    input_schema: {
      type: "object",
      properties: {
        fullName: { type: "string" },
        email: { type: "string" },
        phone: { type: "string" },
        location: { type: "string" },
        linkedin: { type: "string" },
        website: { type: "string" },
      },
    },
  },
  {
    name: "update_summary",
    description: "Replace the resume's professional summary.",
    input_schema: {
      type: "object",
      properties: { summary: { type: "string" } },
      required: ["summary"],
    },
  },
  {
    name: "add_experience",
    description: "Add a new work experience entry to the end of the experience list.",
    input_schema: {
      type: "object",
      properties: {
        role: { type: "string" },
        company: { type: "string" },
        startDate: { type: "string" },
        endDate: { type: "string" },
        bullets: { type: "array", items: { type: "string" } },
      },
      required: ["role", "company", "startDate", "endDate"],
    },
  },
  {
    name: "update_experience",
    description: "Update fields on an existing experience entry by its zero-based index in the experience list.",
    input_schema: {
      type: "object",
      properties: {
        index: { type: "number" },
        role: { type: "string" },
        company: { type: "string" },
        startDate: { type: "string" },
        endDate: { type: "string" },
      },
      required: ["index"],
    },
  },
  {
    name: "set_experience_bullets",
    description: "Replace all bullet points for an experience entry by its zero-based index.",
    input_schema: {
      type: "object",
      properties: {
        index: { type: "number" },
        bullets: { type: "array", items: { type: "string" } },
      },
      required: ["index", "bullets"],
    },
  },
  {
    name: "remove_experience",
    description: "Remove an experience entry by its zero-based index.",
    input_schema: {
      type: "object",
      properties: { index: { type: "number" } },
      required: ["index"],
    },
  },
  {
    name: "add_education",
    description: "Add a new education entry.",
    input_schema: {
      type: "object",
      properties: {
        school: { type: "string" },
        degree: { type: "string" },
        startDate: { type: "string" },
        endDate: { type: "string" },
      },
      required: ["school", "degree", "startDate", "endDate"],
    },
  },
  {
    name: "remove_education",
    description: "Remove an education entry by its zero-based index.",
    input_schema: {
      type: "object",
      properties: { index: { type: "number" } },
      required: ["index"],
    },
  },
  {
    name: "update_skills",
    description: "Replace the full skills list.",
    input_schema: {
      type: "object",
      properties: { skills: { type: "array", items: { type: "string" } } },
      required: ["skills"],
    },
  },
];

// ---------- Tool execution (pure, operates on a working copy) ----------

export function executeTool(
  resume: ResumeData,
  toolName: string,
  input: Record<string, unknown>
): { resume: ResumeData; description: string } {
  switch (toolName) {
    case "update_contact": {
      const next = { ...resume, contact: { ...resume.contact, ...input } };
      return { resume: next, description: "Updated contact info" };
    }

    case "update_summary": {
      const summary = String(input.summary ?? "");
      return { resume: { ...resume, summary }, description: "Updated summary" };
    }

    case "add_experience": {
      const entry: ExperienceEntry = {
        id: crypto.randomUUID(),
        role: String(input.role ?? ""),
        company: String(input.company ?? ""),
        startDate: String(input.startDate ?? ""),
        endDate: String(input.endDate ?? ""),
        bullets: Array.isArray(input.bullets) ? input.bullets.map(String) : [],
      };
      return {
        resume: { ...resume, experience: [...resume.experience, entry] },
        description: `Added role: ${entry.role} at ${entry.company}`,
      };
    }

    case "update_experience": {
      const index = Number(input.index);
      const experience = resume.experience.map((exp, i) =>
        i === index
          ? {
              ...exp,
              ...(typeof input.role === "string" ? { role: input.role } : {}),
              ...(typeof input.company === "string" ? { company: input.company } : {}),
              ...(typeof input.startDate === "string" ? { startDate: input.startDate } : {}),
              ...(typeof input.endDate === "string" ? { endDate: input.endDate } : {}),
            }
          : exp
      );
      return { resume: { ...resume, experience }, description: `Updated experience #${index}` };
    }

    case "set_experience_bullets": {
      const index = Number(input.index);
      const bullets = Array.isArray(input.bullets) ? input.bullets.map(String) : [];
      const experience = resume.experience.map((exp, i) => (i === index ? { ...exp, bullets } : exp));
      return { resume: { ...resume, experience }, description: `Rewrote bullets for experience #${index}` };
    }

    case "remove_experience": {
      const index = Number(input.index);
      const experience = resume.experience.filter((_, i) => i !== index);
      return { resume: { ...resume, experience }, description: `Removed experience #${index}` };
    }

    case "add_education": {
      const entry: EducationEntry = {
        id: crypto.randomUUID(),
        school: String(input.school ?? ""),
        degree: String(input.degree ?? ""),
        startDate: String(input.startDate ?? ""),
        endDate: String(input.endDate ?? ""),
      };
      return {
        resume: { ...resume, education: [...resume.education, entry] },
        description: `Added education: ${entry.degree} at ${entry.school}`,
      };
    }

    case "remove_education": {
      const index = Number(input.index);
      const education = resume.education.filter((_, i) => i !== index);
      return { resume: { ...resume, education }, description: `Removed education #${index}` };
    }

    case "update_skills": {
      const skills = Array.isArray(input.skills) ? input.skills.map(String) : [];
      return { resume: { ...resume, skills }, description: "Updated skills list" };
    }

    default:
      return { resume, description: `Unknown tool: ${toolName}` };
  }
}

// ---------- Agent loop ----------

export type AgentMessage = { role: "user" | "assistant"; content: string };

export type AgentTurnResult = {
  reply: string;
  resumeData: ResumeData;
  actionsTaken: string[];
};

const SYSTEM_PROMPT = `You are an AI resume-editing assistant embedded in a resume builder called Lettr.
You have tools to directly edit the user's resume - use them whenever the user asks for a change,
rather than just describing what they should do. Only ask a clarifying question if the request is
genuinely ambiguous (e.g. "improve my resume" with no target given - ask what to focus on first).
When rewriting bullets, follow strong resume-writing practice: action verbs, quantified impact where
plausible, no first-person pronouns. Keep replies brief and conversational - the resume UI shows the
result, so you don't need to repeat the full text of what you wrote back to the user.`;

export async function runAgentTurn(params: {
  resumeData: ResumeData;
  history: AgentMessage[];
  userMessage: string;
}): Promise<AgentTurnResult> {
  const client = getClient();
  let workingResume = params.resumeData;
  const actionsTaken: string[] = [];

  const messages: Anthropic.MessageParam[] = [
    ...params.history.map((m) => ({ role: m.role, content: m.content }) as Anthropic.MessageParam),
    {
      role: "user",
      content: `Current resume data (JSON): ${JSON.stringify(workingResume)}\n\nUser request: ${params.userMessage}`,
    },
  ];

  let finalText = "";

  for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1200,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
    );
    const textBlocks = response.content.filter((b): b is Anthropic.TextBlock => b.type === "text");
    finalText = textBlocks.map((b) => b.text).join(" ").trim() || finalText;

    if (toolUseBlocks.length === 0) {
      break; // agent is done, no more tool calls
    }

    messages.push({ role: "assistant", content: response.content });

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of toolUseBlocks) {
      const { resume, description } = executeTool(
        workingResume,
        block.name,
        block.input as Record<string, unknown>
      );
      workingResume = resume;
      actionsTaken.push(description);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: `Done: ${description}`,
      });
    }

    messages.push({ role: "user", content: toolResults });

    if (response.stop_reason !== "tool_use") break;
  }

  return {
    reply: finalText || "Done.",
    resumeData: workingResume,
    actionsTaken,
  };
}
