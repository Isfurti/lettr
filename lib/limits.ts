import { isTemplateFree } from "./templates";
import { agentMonthlyCap, nextResetLabel } from "./ai-costs";

export type Plan = "free" | "pro";

/**
 * Which set of limits applies. "free" is today's free plan: each AI feature
 * once per person, for life. "free_legacy" is for free accounts made before
 * the change, who keep the monthly allowances they signed up with.
 */
export type LimitTier = "free" | "free_legacy" | "pro";

/** Free accounts created from this moment get the once-per-person free plan. */
export const FREE_PLAN_V2_FROM = new Date("2026-10-07T12:00:00Z");

export function limitTier(user: { plan?: string | null; created_at?: string | Date | null } | null | undefined): LimitTier {
  if (user?.plan === "pro") return "pro";
  if (user?.created_at && new Date(user.created_at) < FREE_PLAN_V2_FROM) return "free_legacy";
  return "free";
}

/** "lifetime" = once per person; "month" = resets on the 1st (India time). */
export type UsagePeriod = "lifetime" | "month";

type Limits = {
  period: UsagePeriod;
  maxResumes: number;
  /** PDFs without the small "Made with Lettr" line. After that, PDFs still download, with the line. */
  cleanPdfDownloads: number;
  maxAiWritingAssists: number; // always lifetime - see incrementAiWritingAssistCount
  aiAgent: boolean;
  coverLetters: number;
  interviewSets: number;
  interviewFeedback: number;
  atsAnalyst: number;
  /** Missing keywords shown from a job post; the rest are blurred. */
  keywordsShown: number;
  trackedJobs: number;
  resignationLetterBuilder: boolean;
  docxExport: boolean;
  googleDriveExport: boolean;
};

export const PLAN_LIMITS: Record<LimitTier, Limits> = {
  free: {
    period: "lifetime",
    maxResumes: 1,
    cleanPdfDownloads: 1,
    maxAiWritingAssists: 3,
    aiAgent: false,
    coverLetters: 1,
    interviewSets: 1,
    interviewFeedback: 6, // the 6 questions in that one set
    atsAnalyst: 1,
    keywordsShown: 3,
    trackedJobs: 10,
    resignationLetterBuilder: false,
    docxExport: false,
    googleDriveExport: false,
  },
  free_legacy: {
    period: "month",
    maxResumes: 1,
    cleanPdfDownloads: 3,
    maxAiWritingAssists: 5,
    aiAgent: false,
    coverLetters: 3,
    interviewSets: 2,
    interviewFeedback: 15,
    atsAnalyst: 3,
    keywordsShown: Infinity,
    trackedJobs: Infinity,
    resignationLetterBuilder: false,
    docxExport: false,
    googleDriveExport: false,
  },
  pro: {
    period: "month",
    maxResumes: Infinity,
    cleanPdfDownloads: Infinity,
    maxAiWritingAssists: Infinity,
    aiAgent: true,
    // Fair use: generous, but bounded (each is a small, cheap AI call).
    coverLetters: Infinity,
    interviewSets: 40,
    interviewFeedback: 300,
    atsAnalyst: 100,
    keywordsShown: Infinity,
    trackedJobs: Infinity,
    resignationLetterBuilder: true,
    docxExport: true,
    googleDriveExport: true,
  },
};

export type LimitCheck = { allowed: true } | { allowed: false; reason: string };

/** "1 free" / "3 a month" style wording for an allowance. */
export function allowanceLabel(n: number, period: UsagePeriod): string {
  if (!Number.isFinite(n)) return "Unlimited";
  return period === "lifetime" ? `${n} free` : `${n} a month`;
}

/** The end of a "you've used it" message: when more arrive, or how to get more. */
function moreLine(tier: LimitTier, now: Date): string {
  if (tier === "free") return "Upgrade to Pro to keep going.";
  if (tier === "free_legacy") return `More on ${nextResetLabel(now)}, or upgrade to Pro for many more.`;
  return `They reset on ${nextResetLabel(now)}.`;
}

export function canCreateResume(tier: LimitTier, currentResumeCount: number): LimitCheck {
  const limit = PLAN_LIMITS[tier].maxResumes;
  if (currentResumeCount < limit) return { allowed: true };
  return {
    allowed: false,
    reason: `Free plan is limited to ${limit} resume${limit === 1 ? "" : "s"}. Upgrade to Pro for unlimited resumes.`,
  };
}

/** Free PDFs never stop: the first ones are clean, the rest carry a small "Made with Lettr" line. */
export function pdfNeedsFooter(tier: LimitTier, downloadsSoFar: number): boolean {
  return downloadsSoFar >= PLAN_LIMITS[tier].cleanPdfDownloads;
}

export function canUseAiWritingAssist(tier: LimitTier, currentCount: number): LimitCheck {
  const limit = PLAN_LIMITS[tier].maxAiWritingAssists;
  if (currentCount < limit) return { allowed: true };
  return {
    allowed: false,
    reason: `You've used your ${limit} free AI rewrites. Upgrade to Pro for unlimited AI bullet and summary rewriting.`,
  };
}

export function canUseAiAgent(tier: LimitTier): LimitCheck {
  if (PLAN_LIMITS[tier].aiAgent) return { allowed: true };
  return { allowed: false, reason: "The AI Resume Agent is a Pro feature. Upgrade to unlock it." };
}

export function canUseTemplate(tier: LimitTier, templateId: string): LimitCheck {
  if (tier === "pro") return { allowed: true };
  if (isTemplateFree(templateId)) return { allowed: true };
  return {
    allowed: false,
    reason: "This template is a Pro feature. Upgrade to unlock every template, or switch to Classic or Modern.",
  };
}

/** Reused letters don't count. */
export function canUseCoverLetterBuilder(tier: LimitTier, used = 0, now = new Date()): LimitCheck {
  const { coverLetters: limit } = PLAN_LIMITS[tier];
  if (used < limit) return { allowed: true };
  return {
    allowed: false,
    reason:
      tier === "free"
        ? "You've used your free cover letter. Upgrade to Pro for unlimited letters from our best writing model."
        : `You've written your ${limit} free cover letters this month. ${moreLine(tier, now)}`,
  };
}

/** Fair-use cap on AI Agent messages per month, by price region. */
export function canSendAgentMessage(
  tier: string | null | undefined,
  usedThisMonth: number,
  now = new Date()
): LimitCheck & { limit: number } {
  const limit = agentMonthlyCap(tier);
  if (usedThisMonth < limit) return { allowed: true, limit };
  return {
    allowed: false,
    limit,
    reason: `You've used this month's ${limit} AI Agent messages (our fair-use limit). They reset on ${nextResetLabel(now)}. You can still edit, rewrite bullets and use every other Pro feature.`,
  };
}

export function canUseResignationLetterBuilder(tier: LimitTier): LimitCheck {
  if (PLAN_LIMITS[tier].resignationLetterBuilder) return { allowed: true };
  return { allowed: false, reason: "The resignation letter builder is a Pro feature. Upgrade to unlock it." };
}

export function canExportDocx(tier: LimitTier): LimitCheck {
  if (PLAN_LIMITS[tier].docxExport) return { allowed: true };
  return { allowed: false, reason: "DOCX export is a Pro feature. Upgrade to unlock it." };
}

export function canExportToGoogleDrive(tier: LimitTier): LimitCheck {
  if (PLAN_LIMITS[tier].googleDriveExport) return { allowed: true };
  return { allowed: false, reason: "Google Drive export is a Pro feature. Upgrade to unlock it." };
}

/** Interview practice: new question sets and answer feedback. */
export function canUseInterviewPractice(
  tier: LimitTier,
  kind: "set" | "feedback",
  used: number,
  now = new Date()
): LimitCheck & { limit: number } {
  const limit = kind === "set" ? PLAN_LIMITS[tier].interviewSets : PLAN_LIMITS[tier].interviewFeedback;
  if (used < limit) return { allowed: true, limit };
  if (tier === "free") {
    return {
      allowed: false,
      limit,
      reason:
        kind === "set"
          ? "You've used your free practice interview. Upgrade to Pro for 40 a month."
          : "You've used the free feedback on your practice interview. Upgrade to Pro for feedback on every answer.",
    };
  }
  const what = kind === "set" ? `${limit} practice interviews` : `${limit} answer reviews`;
  return {
    allowed: false,
    limit,
    reason:
      tier === "free_legacy"
        ? `You've used this month's ${what} on the free plan. ${moreLine(tier, now)}`
        : `You've used this month's ${what} (our fair-use limit). ${moreLine(tier, now)}`,
  };
}

/** The AI part of the ATS score analyst (the instant score itself is free and unlimited). */
export function canUseAtsAnalyst(tier: LimitTier, used: number, now = new Date()): LimitCheck & { limit: number } {
  const limit = PLAN_LIMITS[tier].atsAnalyst;
  if (used < limit) return { allowed: true, limit };
  return {
    allowed: false,
    limit,
    reason:
      tier === "free"
        ? "You've used your free analyst review. Upgrade to Pro for 100 a month."
        : tier === "free_legacy"
          ? `You've used this month's ${limit} free analyst reviews. ${moreLine(tier, now)}`
          : `You've used this month's ${limit} analyst reviews (our fair-use limit). ${moreLine(tier, now)}`,
  };
}

export function canTrackJob(tier: LimitTier, tracked: number): LimitCheck {
  const limit = PLAN_LIMITS[tier].trackedJobs;
  if (tracked < limit) return { allowed: true };
  return {
    allowed: false,
    reason: `The free plan tracks up to ${limit} jobs. Remove one, or upgrade to Pro to track as many as you like.`,
  };
}
