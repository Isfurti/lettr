import { isTemplateFree } from "./templates";

export type Plan = "free" | "pro";

// Mirrors Rezi's actual published Free vs Pro matrix (rezi.ai/pricing).
export const PLAN_LIMITS = {
  free: {
    maxResumes: 1,
    maxPdfDownloads: 3,
    maxAiWritingAssists: 5, // lifetime, not per-window - see incrementAiWritingAssistCount in lib/db.ts
    aiAgent: false, // moved to Pro-only - the Agent can make up to 5 Anthropic calls per message
    coverLetterBuilder: false,
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
    reason: "This template is a Pro feature. Upgrade to unlock all 10 templates, or switch to Classic or Modern.",
  };
}

export function canUseCoverLetterBuilder(plan: Plan): LimitCheck {
  if (PLAN_LIMITS[plan].coverLetterBuilder) return { allowed: true };
  return { allowed: false, reason: "The cover letter builder is a Pro feature. Upgrade to unlock it." };
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
