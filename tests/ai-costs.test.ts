import { describe, it, expect } from "vitest";
import {
  MODELS,
  agentMonthlyCap,
  aiCacheKey,
  coverLetterModel,
  costWithoutSavingsUsd,
  estimateCostUsd,
  monthStartIST,
  nextResetLabel,
  usageFromApi,
  withCacheBreakpoint,
} from "@/lib/ai-costs";
import { canSendAgentMessage } from "@/lib/limits";

describe("model by plan", () => {
  it("writes free cover letters with Haiku and Pro ones with Sonnet", () => {
    expect(coverLetterModel("free")).toBe(MODELS.haiku);
    expect(coverLetterModel("pro")).toBe(MODELS.sonnet);
  });
});

describe("AI Agent fair use", () => {
  it("gives cheaper regions a lower monthly cap", () => {
    expect(agentMonthlyCap("value")).toBeLessThan(agentMonthlyCap("mid"));
    expect(agentMonthlyCap("mid")).toBeLessThan(agentMonthlyCap("full"));
    expect(agentMonthlyCap(null)).toBe(agentMonthlyCap("full"));
  });
  it("blocks at the cap and says when it resets", () => {
    const now = new Date("2026-10-31T20:00:00Z"); // 1 November 1:30am in India
    expect(canSendAgentMessage("value", 99).allowed).toBe(true);
    const r = canSendAgentMessage("value", 100, new Date("2026-10-15T10:00:00Z"));
    expect(r.allowed).toBe(false);
    if (!r.allowed) expect(r.reason).toContain("1 November");
    expect(nextResetLabel(now)).toBe("1 December");
  });
  it("starts the month at midnight India time", () => {
    expect(monthStartIST(new Date("2026-10-15T10:00:00Z")).toISOString()).toBe("2026-09-30T18:30:00.000Z");
    expect(monthStartIST(new Date("2026-10-31T19:00:00Z")).toISOString()).toBe("2026-10-31T18:30:00.000Z");
  });
});

describe("reuse key", () => {
  it("is the same for the same request and changes with any input", () => {
    const a = aiCacheKey("cover_letter", ["m", "u1", "prompt"]);
    expect(aiCacheKey("cover_letter", ["m", "u1", "prompt"])).toBe(a);
    expect(aiCacheKey("cover_letter", ["m", "u2", "prompt"])).not.toBe(a);
    expect(aiCacheKey("cover_letter", ["m2", "u1", "prompt"])).not.toBe(a);
    expect(aiCacheKey("import", ["m", "u1", "prompt"])).not.toBe(a);
  });
});

describe("prompt cache breakpoint", () => {
  it("marks only the last block of the last message, without changing the input", () => {
    const msgs = [
      { role: "user" as const, content: "hello" },
      { role: "assistant" as const, content: [{ type: "text", text: "hi" }, { type: "tool_use", id: "t1", name: "x", input: {} }] },
    ];
    const out = withCacheBreakpoint(msgs);
    const last = out[1].content as { cache_control?: unknown }[];
    expect(last[1].cache_control).toEqual({ type: "ephemeral" });
    expect(last[0].cache_control).toBeUndefined();
    expect(out[0].content).toBe("hello");
    expect((msgs[1].content as { cache_control?: unknown }[])[1].cache_control).toBeUndefined();
  });
  it("turns a plain-text last message into a block it can mark", () => {
    const out = withCacheBreakpoint([{ role: "user" as const, content: "resume json" }]);
    expect(out[0].content).toEqual([{ type: "text", text: "resume json", cache_control: { type: "ephemeral" } }]);
  });
});

describe("cost estimates", () => {
  it("charges cache reads at a tenth and batch at half", () => {
    const fresh = estimateCostUsd(MODELS.sonnet, usageFromApi({ input_tokens: 10000, output_tokens: 1000 }));
    expect(fresh).toBeCloseTo(0.045, 6);
    const cached = estimateCostUsd(MODELS.sonnet, usageFromApi({ input_tokens: 0, cache_read_input_tokens: 10000, output_tokens: 1000 }));
    expect(cached).toBeCloseTo(0.018, 6);
    expect(costWithoutSavingsUsd(MODELS.sonnet, usageFromApi({ cache_read_input_tokens: 10000, output_tokens: 1000 }))).toBeCloseTo(0.045, 6);
    expect(estimateCostUsd(MODELS.haiku, usageFromApi({ input_tokens: 1000, output_tokens: 100 }), true)).toBeCloseTo(0.00075, 8);
  });
});
