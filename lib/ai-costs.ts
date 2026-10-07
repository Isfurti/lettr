import { createHash } from "node:crypto";
import type { PricingTier } from "./pricing-region";

/**
 * Everything that keeps Lettr's AI bill down, in one place (action plan
 * section 6). Pure functions only, so it's all unit tested.
 *
 * 1. Prompt caching on the AI Resume Agent (lib/ai-agent.ts uses
 *    withCacheBreakpoint below).
 * 2. Model by plan: free-plan cover letters use Haiku, Pro uses Sonnet.
 * 3. Reuse: the same resume + job post returns the saved answer (aiCacheKey).
 * 4. Monthly fair-use cap on AI Agent messages, lower in cheaper regions.
 * 5. Review analysis runs through the batch API (lib/review-batch.ts).
 */

export const MODELS = {
  /** Best writing and tool use. Pro cover letters and the AI Agent. */
  sonnet: "claude-sonnet-4-6",
  /** Fast and about 3x cheaper. Everything else. */
  haiku: "claude-haiku-4-5-20251001",
} as const;

export type ModelId = (typeof MODELS)[keyof typeof MODELS];

export function coverLetterModel(plan: "free" | "pro"): ModelId {
  return plan === "pro" ? MODELS.sonnet : MODELS.haiku;
}

/**
 * AI Agent messages a Pro user can send per calendar month (India time).
 * Lower where prices are lower, so a heavy user can't cost more than they pay.
 * Change these numbers freely; nothing else depends on them.
 */
export const AGENT_MONTHLY_CAP: Record<PricingTier, number> = {
  full: 300,
  mid: 200,
  value: 100,
};

export function agentMonthlyCap(tier: string | null | undefined): number {
  if (tier === "mid" || tier === "value") return AGENT_MONTHLY_CAP[tier];
  return AGENT_MONTHLY_CAP.full;
}

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/** Start of the current calendar month in India time, as a real instant. */
export function monthStartIST(now = new Date()): Date {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  return new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth(), 1) - IST_OFFSET_MS);
}

/** When the monthly limits reset next, e.g. "1 November". */
export function nextResetLabel(now = new Date()): string {
  const ist = new Date(now.getTime() + IST_OFFSET_MS);
  const next = new Date(Date.UTC(ist.getUTCFullYear(), ist.getUTCMonth() + 1, 1));
  return next.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
}

/** Stable key for "same request as before". Anything that changes the answer must be in `parts`. */
export function aiCacheKey(feature: string, parts: unknown[]): string {
  return `${feature}:${createHash("sha256").update(JSON.stringify(parts)).digest("hex")}`;
}

// ---------- Prompt caching ----------

type Block = { type: string; cache_control?: { type: "ephemeral" } } & Record<string, unknown>;
type Msg = { role: "user" | "assistant"; content: string | Block[] };

/**
 * Returns a copy of `messages` with one cache breakpoint on the last block of
 * the last message. Called before every request in the agent's tool loop, so
 * each follow-up call reads the whole conversation so far from the cache
 * (about 10% of the normal input price) instead of paying for it again.
 * Only one moving breakpoint is used, so we never pass the API's limit of 4.
 */
export function withCacheBreakpoint<M extends Msg>(messages: M[]): M[] {
  if (messages.length === 0) return messages;
  const out = messages.map((m) => ({ ...m }));
  const last = out[out.length - 1];
  const blocks: Block[] =
    typeof last.content === "string" ? [{ type: "text", text: last.content }] : last.content.map((b) => ({ ...b }));
  if (blocks.length === 0) return out;
  blocks[blocks.length - 1] = { ...blocks[blocks.length - 1], cache_control: { type: "ephemeral" } };
  out[out.length - 1] = { ...last, content: blocks };
  return out;
}

// ---------- Usage and cost ----------

export type TokenUsage = {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
};

export const NO_USAGE: TokenUsage = { inputTokens: 0, outputTokens: 0, cacheReadTokens: 0, cacheWriteTokens: 0 };

type ApiUsage = {
  input_tokens?: number | null;
  output_tokens?: number | null;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
};

export function usageFromApi(u: ApiUsage | null | undefined): TokenUsage {
  return {
    inputTokens: u?.input_tokens ?? 0,
    outputTokens: u?.output_tokens ?? 0,
    cacheReadTokens: u?.cache_read_input_tokens ?? 0,
    cacheWriteTokens: u?.cache_creation_input_tokens ?? 0,
  };
}

export function addUsage(a: TokenUsage, b: TokenUsage): TokenUsage {
  return {
    inputTokens: a.inputTokens + b.inputTokens,
    outputTokens: a.outputTokens + b.outputTokens,
    cacheReadTokens: a.cacheReadTokens + b.cacheReadTokens,
    cacheWriteTokens: a.cacheWriteTokens + b.cacheWriteTokens,
  };
}

/** US dollars per million tokens (list prices; check anthropic.com/pricing if they change). */
const PRICES: Record<string, { input: number; output: number }> = {
  [MODELS.sonnet]: { input: 3, output: 15 },
  [MODELS.haiku]: { input: 1, output: 5 },
};

/**
 * Estimated cost in US dollars. Cache writes cost 1.25x input, cache reads
 * 0.1x input, and batch requests half price.
 */
export function estimateCostUsd(model: string, u: TokenUsage, batch = false): number {
  const p = PRICES[model] ?? PRICES[MODELS.sonnet];
  const cost =
    (u.inputTokens * p.input +
      u.cacheWriteTokens * p.input * 1.25 +
      u.cacheReadTokens * p.input * 0.1 +
      u.outputTokens * p.output) /
    1_000_000;
  return batch ? cost / 2 : cost;
}

/** What the same tokens would have cost with no prompt caching and no batch discount. */
export function costWithoutSavingsUsd(model: string, u: TokenUsage): number {
  const p = PRICES[model] ?? PRICES[MODELS.sonnet];
  return ((u.inputTokens + u.cacheReadTokens + u.cacheWriteTokens) * p.input + u.outputTokens * p.output) / 1_000_000;
}
