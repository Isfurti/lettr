import { describe, it, expect } from "vitest";
import { executeTool } from "@/lib/ai-agent";
import { emptyResume } from "@/lib/types";
import type { ResumeData } from "@/lib/types";

describe("executeTool", () => {
  it("update_contact merges fields without clobbering unspecified ones", () => {
    const resume: ResumeData = { ...emptyResume, contact: { fullName: "Jane", email: "jane@x.com", phone: "555" } };
    const { resume: next } = executeTool(resume, "update_contact", { location: "Austin, TX" });
    expect(next.contact.fullName).toBe("Jane");
    expect(next.contact.phone).toBe("555");
    expect(next.contact.location).toBe("Austin, TX");
  });

  it("update_summary replaces the summary", () => {
    const { resume: next } = executeTool(emptyResume, "update_summary", { summary: "New summary text." });
    expect(next.summary).toBe("New summary text.");
  });

  it("add_experience appends a new entry with a generated id", () => {
    const { resume: next, description } = executeTool(emptyResume, "add_experience", {
      role: "Engineer",
      company: "Acme",
      startDate: "2021",
      endDate: "Present",
      bullets: ["Did a thing"],
    });
    expect(next.experience).toHaveLength(1);
    expect(next.experience[0].id).toBeTruthy();
    expect(next.experience[0].role).toBe("Engineer");
    expect(description).toMatch(/Engineer/);
  });

  it("update_experience patches only the targeted index", () => {
    const resume: ResumeData = {
      ...emptyResume,
      experience: [
        { id: "e1", role: "A", company: "X", startDate: "2020", endDate: "2021", bullets: [] },
        { id: "e2", role: "B", company: "Y", startDate: "2021", endDate: "2022", bullets: [] },
      ],
    };
    const { resume: next } = executeTool(resume, "update_experience", { index: 1, role: "B2" });
    expect(next.experience[0].role).toBe("A");
    expect(next.experience[1].role).toBe("B2");
    expect(next.experience[1].company).toBe("Y");
  });

  it("set_experience_bullets replaces bullets for the targeted index only", () => {
    const resume: ResumeData = {
      ...emptyResume,
      experience: [
        { id: "e1", role: "A", company: "X", startDate: "2020", endDate: "2021", bullets: ["old"] },
      ],
    };
    const { resume: next } = executeTool(resume, "set_experience_bullets", { index: 0, bullets: ["new1", "new2"] });
    expect(next.experience[0].bullets).toEqual(["new1", "new2"]);
  });

  it("remove_experience removes only the targeted index", () => {
    const resume: ResumeData = {
      ...emptyResume,
      experience: [
        { id: "e1", role: "A", company: "X", startDate: "2020", endDate: "2021", bullets: [] },
        { id: "e2", role: "B", company: "Y", startDate: "2021", endDate: "2022", bullets: [] },
      ],
    };
    const { resume: next } = executeTool(resume, "remove_experience", { index: 0 });
    expect(next.experience).toHaveLength(1);
    expect(next.experience[0].role).toBe("B");
  });

  it("add_education appends a new entry", () => {
    const { resume: next } = executeTool(emptyResume, "add_education", {
      school: "State University",
      degree: "B.S. CS",
      startDate: "2015",
      endDate: "2019",
    });
    expect(next.education).toHaveLength(1);
    expect(next.education[0].school).toBe("State University");
  });

  it("remove_education removes only the targeted index", () => {
    const resume: ResumeData = {
      ...emptyResume,
      education: [
        { id: "ed1", school: "A", degree: "X", startDate: "2010", endDate: "2014" },
        { id: "ed2", school: "B", degree: "Y", startDate: "2015", endDate: "2019" },
      ],
    };
    const { resume: next } = executeTool(resume, "remove_education", { index: 1 });
    expect(next.education).toHaveLength(1);
    expect(next.education[0].school).toBe("A");
  });

  it("update_skills replaces the full skills list", () => {
    const resume: ResumeData = { ...emptyResume, skills: ["Old"] };
    const { resume: next } = executeTool(resume, "update_skills", { skills: ["Python", "SQL"] });
    expect(next.skills).toEqual(["Python", "SQL"]);
  });

  it("unknown tool name leaves resume unchanged and reports it", () => {
    const { resume: next, description } = executeTool(emptyResume, "not_a_real_tool", {});
    expect(next).toEqual(emptyResume);
    expect(description).toMatch(/unknown/i);
  });

  it("does not mutate the input resume object (returns a new object)", () => {
    const resume: ResumeData = { ...emptyResume, summary: "original" };
    const { resume: next } = executeTool(resume, "update_summary", { summary: "changed" });
    expect(resume.summary).toBe("original");
    expect(next.summary).toBe("changed");
  });
});

import { runAgentTurn } from "@/lib/ai-agent";
import type Anthropic from "@anthropic-ai/sdk";

describe("runAgentTurn - prompt caching", () => {
  it("caches tools and instructions, moves one breakpoint along the tool loop, and adds up usage", async () => {
    const calls: Anthropic.MessageCreateParamsNonStreaming[] = [];
    const replies = [
      {
        content: [{ type: "tool_use", id: "t1", name: "update_summary", input: { summary: "New" } }],
        stop_reason: "tool_use",
        usage: { input_tokens: 3000, output_tokens: 50, cache_creation_input_tokens: 2000, cache_read_input_tokens: 0 },
      },
      {
        content: [{ type: "text", text: "Updated your summary." }],
        stop_reason: "end_turn",
        usage: { input_tokens: 100, output_tokens: 20, cache_creation_input_tokens: 80, cache_read_input_tokens: 5000 },
      },
    ];
    const client = {
      messages: {
        create: async (p: Anthropic.MessageCreateParamsNonStreaming) => {
          calls.push(JSON.parse(JSON.stringify(p)));
          return replies[calls.length - 1] as unknown as Anthropic.Message;
        },
      },
    };
    const result = await runAgentTurn(
      {
        resumeData: emptyResume,
        history: [
          { role: "user", content: "hi" },
          { role: "assistant", content: "Hello" },
          { role: "user", content: "tighten my summary" },
        ],
        userMessage: "tighten my summary",
      },
      client
    );

    expect(result.resumeData.summary).toBe("New");
    expect(result.usage).toEqual({ inputTokens: 3100, outputTokens: 70, cacheReadTokens: 5000, cacheWriteTokens: 2080 });

    for (const call of calls) {
      const tools = call.tools as { cache_control?: unknown }[];
      expect(tools[tools.length - 1].cache_control).toEqual({ type: "ephemeral" });
      expect((call.system as { cache_control?: unknown }[])[0].cache_control).toEqual({ type: "ephemeral" });
      // Exactly one breakpoint in the messages: on the last one.
      const marked = JSON.stringify(call.messages).match(/cache_control/g) ?? [];
      expect(marked.length).toBe(1);
      const last = call.messages[call.messages.length - 1].content as { cache_control?: unknown }[];
      expect(last[last.length - 1].cache_control).toEqual({ type: "ephemeral" });
    }
    // The duplicate copy of the new message is dropped from history.
    const first = calls[0].messages;
    expect(first.length).toBe(3);
    expect(JSON.stringify(first[2])).toContain("User request: tighten my summary");
  });
});
