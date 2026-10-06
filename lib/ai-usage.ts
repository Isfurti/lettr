import * as Sentry from "@sentry/nextjs";
import { recordAiUsage } from "./db";
import type { TokenUsage } from "./ai-costs";

/** AI features as recorded in ai_usage_events. */
export type AiFeature =
  | "agent"
  | "cover_letter"
  | "resignation_letter"
  | "bullets"
  | "summary"
  | "import"
  | "check"
  | "review";

/**
 * Records one AI request. Never throws: a failed log line must not break
 * the feature the user is waiting for.
 */
export async function trackAiUsage(e: {
  userId: string | null;
  feature: AiFeature;
  model: string;
  usage?: TokenUsage;
  reused?: boolean;
  batch?: boolean;
}) {
  try {
    await recordAiUsage({ userId: e.userId, feature: e.feature, model: e.model, ...e.usage, reused: e.reused, batch: e.batch });
  } catch (err) {
    Sentry.captureException(err);
  }
}
