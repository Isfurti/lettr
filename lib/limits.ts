import { isTemplateFree } from "./templates";
import { FREE_COVER_LETTERS_PER_MONTH, agentMonthlyCap, nextResetLabel } from "./ai-costs";

export type Plan = "free" | "pro";

// Mirrors Rezi's actual published Free vs Pro matrix (rezi.ai/pricing).
export const PLAN_LIMITS = {
  free: {
    maxResumes: 1,
    maxPdfDownloads: 3,
    maxAiWritingAssists: 5, // lifetime, not per-window - see incrementAiWritingAssistCount in lib/db.ts
    aiAgent: false, // moved to Pro-only - the Agent can make up to 5 Anthropic calls per message
    coverLetterBuilder: true, // a few a month, written by the cheaper model (see ai-costs.ts)
    coverLettersPerMonth: FREE_COVER_LETTERS_PER_MONTH,
    interviewSetsPerMonth: 2,
    interviewFeedbackPerMonth: 15,
    atsAnalystPerMonth: 3,
    resignationLetterBuilder: false,
    docxExport: false,
    googleDriveExport: false,
  },
  pro: {
    maxResumes: Infinity,
    maxPdfDownloads: Infinity,
    maxAiWritingAssists: Infinity,
    aiAgent: true,
    coverLetterBuilder: true,
    coverLettersPerMonth: Infinity,
    // Fair use: generous, but bounded (each is a small, cheap AI call).
    interviewSetsPerMonth: 40,
    interviewFeedbackPerMonth: 300,
    atsAnalystPerMonth: 100,
    resignationLetterBuilder: true,
    docxExport: true,
    googleDriveExport: true,
  },
} as const;

export type LimitCheck = { allowed: true } | { allowed: false; reason: string };

export function canCreateResume(plan: Plan, currentResumeCount: number): LimitCheck {
  const limit = PLAN_LIMITS[plan].maxResumes;
  if (currentResumeCount < limit) return { allowed: true };
  return {
    allowed: false,
    reason: `Free plan is limited to ${limit} resume${limit === 1 ? "" : "s"}. Upgrade to Pro for unlimited resumes.`,
  };
}

export function canDownloadPdf(plan: Plan, currentDownloadCount: number): LimitCheck {
  const limit = PLAN_LIMITS[plan].maxPdfDownloads;
  if (currentDownloadCount < limit) return { allowed: true };
  return {
    allowed: false,
    reason: `Free plan is limited to ${limit} PDF downloads. Upgrade to Pro for unlimited downloads.`,
  };
}

export function canUseAiWritingAssist(plan: Plan, currentCount: number): LimitCheck {
  const limit = PLAN_LIMITS[plan].maxAiWritingAssists;
  if (currentCount < limit) return { allowed: true };
  return {
    allowed: false,
    reason: `You've used your ${limit} free AI writing assists. Upgrade to Pro for unlimited AI bullet and summary rewriting.`,
  };
}

export function canUseAiAgent(plan: Plan): LimitCheck {
  if (PLAN_LIMITS[plan].aiAgent) return { allowed: true };
  return { allowed: false, reason: "The AI Resume Agent is a Pro feature. Upgrade to unlock it." };
}

export function canUseTemplate(plan: Plan, templateId: string): LimitCheck {
  if (plan === "pro") return { allowed: true };
  if (isTemplateFree(templateId)) return { allowed: true };
  return {
    allowed: false,
    reason: "This template is a Pro feature. Upgrade to unlock every template, or switch to Classic or Modern.",
  };
}

/** Free plan: a few cover letters per calendar month. Reused letters don't count. */
export function canUseCoverLetterBuilder(plan: Plan, usedThisMonth = 0, now = new Date()): LimitCheck {
  if (!PLAN_LIMITS[plan].coverLetterBuilder) {
    return { allowed: false, reason: "The cover letter builder is a Pro feature. Upgrade to unlock it." };
  }
  const limit = PLAN_LIMITS[plan].coverLettersPerMonth;
  if (usedThisMonth < limit) return { allowed: true };
  return {
    allowed: false,
    reason: `You've written your ${limit} free cover letters this month. More on ${nextResetLabel(now)}, or upgrade to Pro for unlimited letters from our best writing model.`,
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

export function canUseResignationLetterBuilder(plan: Plan): LimitCheck {
  if (PLAN_LIMITS[plan].resignationLetterBuilder) return { allowed: true };
  return { allowed: false, reason: "The resignation letter builder is a Pro feature. Upgrade to unlock it." };
}

export function canExportDocx(plan: Plan): LimitCheck {
  if (PLAN_LIMITS[plan].docxExport) return { allowed: true };
  return { allowed: false, reason: "DOCX export is a Pro feature. Upgrade to unlock it." };
}

export function canExportToGoogleDrive(plan: Plan): LimitCheck {
  if (PLAN_LIMITS[plan].googleDriveExport) return { allowed: true };
  return { allowed: false, reason: "Google Drive export is a Pro feature. Upgrade to unlock it." };
}

/** Interview practice: new question sets and answer feedback per calendar month. */
export function canUseInterviewPractice(
  plan: Plan,
  kind: "set" | "feedback",
  usedThisMonth: number,
  now = new Date()
): LimitCheck & { limit: number } {
  const limit = kind === "set" ? PLAN_LIMITS[plan].interviewSetsPerMonth : PLAN_LIMITS[plan].interviewFeedbackPerMonth;
  if (usedThisMonth < limit) return { allowed: true, limit };
  const what = kind === "set" ? `${limit} practice interviews` : `${limit} answer reviews`;
  return {
    allowed: false,
    limit,
    reason:
      plan === "free"
        ? `You've used this month's ${what} on the free plan. More on ${nextResetLabel(now)}, or go Pro for many more.`
        : `You've used this month's ${what} (our fair-use limit). They reset on ${nextResetLabel(now)}.`,
  };
}

/** The AI part of the ATS score analyst (the instant score itself is free and unlimited). */
export function canUseAtsAnalyst(plan: Plan, usedThisMonth: number, now = new Date()): LimitCheck & { limit: number } {
  const limit = PLAN_LIMITS[plan].atsAnalystPerMonth;
  if (usedThisMonth < limit) return { allowed: true, limit };
  return {
    allowed: false,
    limit,
    reason:
      plan === "free"
        ? `You've used this month's ${limit} free analyst reviews. More on ${nextResetLabel(now)}, or go Pro for many more.`
        : `You've used this month's ${limit} analyst reviews (our fair-use limit). They reset on ${nextResetLabel(now)}.`,
  };
}
