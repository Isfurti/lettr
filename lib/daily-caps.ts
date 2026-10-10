import { dayStartIST } from "./ai-costs";
import { countAiUsesAny } from "./db";
import { canUseAiToday, type DailyFeature, type LimitCheck, type LimitTier } from "./limits";

/** Which tracked AI features each daily limit counts. */
const TRACKED: Record<DailyFeature, string[]> = {
  agent: ["agent"],
  rewrite: ["bullets", "summary"],
  cover_letter: ["cover_letter"],
  resignation_letter: ["resignation_letter"],
  ats_analyst: ["ats_analyst"],
  interview: ["interview"],
  interview_feedback: ["interview_feedback"],
  import: ["import"],
};

/** The daily fair-use check for one AI request. Call it just before the AI runs. */
export async function checkDailyAiCap(userId: string, tier: LimitTier, feature: DailyFeature): Promise<LimitCheck> {
  const since = dayStartIST();
  const [usedFeature, usedAll] = await Promise.all([
    countAiUsesAny(userId, TRACKED[feature], since),
    countAiUsesAny(userId, null, since),
  ]);
  return canUseAiToday(tier, feature, usedFeature, usedAll);
}
