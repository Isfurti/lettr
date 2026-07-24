export type Plan = "free" | "pro";

// Mirrors Rezi's actual published Free vs Pro matrix (rezi.ai/pricing).
export const PLAN_LIMITS = {
  free: {
    maxResumes: 1,
    maxPdfDownloads: 3,
    coverLetterBuilder: false,
    resignationLetterBuilder: false,
    docxExport: false,
    googleDriveExport: false,
    fullRealtimeScore: false, // "Rezi Score" - limited on free
  },
  pro: {
    maxResumes: Infinity,
    maxPdfDownloads: Infinity,
    coverLetterBuilder: true,
    resignationLetterBuilder: true,
    docxExport: true,
    googleDriveExport: true,
    fullRealtimeScore: true,
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
