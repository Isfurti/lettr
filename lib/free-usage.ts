import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { monthStartIST } from "./ai-costs";
import { countAiUses, countFreeUses, recordFreeUse, type FreeUseWho } from "./db";
import { emailHash } from "./email-normalise";
import { limitTier, PLAN_LIMITS, type LimitTier, type UsagePeriod } from "./limits";

/**
 * How much of a limited feature someone has used, and recording a new use.
 * Free plan: once per person for life, matched on the account, the email and
 * the browser. Older free accounts and Pro: per calendar month.
 */

const DEVICE_COOKIE = "lettr_did";

/** A random code for this browser (no personal data). Set on first use, kept 2 years. */
export async function browserId(): Promise<string | null> {
  try {
    const jar = await cookies();
    const existing = jar.get(DEVICE_COOKIE)?.value;
    if (existing && /^[a-f0-9-]{36}$/.test(existing)) return existing;
    const id = randomUUID();
    jar.set(DEVICE_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 730,
      path: "/",
    });
    return id;
  } catch {
    return null; // not in a request (tests, scripts)
  }
}

export type UsageContext = { tier: LimitTier; who: FreeUseWho };

export async function usageContext(user: {
  id: string;
  email?: string | null;
  plan?: string | null;
  created_at?: string | Date | null;
}): Promise<UsageContext> {
  const tier = limitTier(user);
  return {
    tier,
    who: { userId: user.id, emailHash: emailHash(user.email), deviceId: tier === "free" ? await browserId() : null },
  };
}

/** Features counted once per person on the free plan. */
export type FreeFeature = "cover_letter" | "ats_analyst" | "interview" | "interview_feedback" | "rewrite" | "pdf_clean";

/** Uses so far: for life on the free plan, this month otherwise. */
export async function usedSoFar(ctx: UsageContext, feature: Exclude<FreeFeature, "rewrite" | "pdf_clean">): Promise<number> {
  if (ctx.tier === "free") return countFreeUses(ctx.who, [feature]);
  return countAiUses(ctx.who.userId, feature, monthStartIST());
}

/** AI rewrites have a lifetime counter on the account; on the free plan the email and browser count too. */
export async function rewritesUsed(ctx: UsageContext, accountCount: number): Promise<number> {
  if (ctx.tier !== "free") return accountCount;
  return Math.max(accountCount, await countFreeUses(ctx.who, ["rewrite"]));
}

/** Call after a successful use. Only the free plan needs its own record. */
export async function recordUse(ctx: UsageContext, feature: FreeFeature) {
  if (ctx.tier === "free") await recordFreeUse(ctx.who, feature);
}

/** Clean PDFs (no footer) used so far: per person on the free plan, per account otherwise. */
export async function cleanPdfsUsed(ctx: UsageContext, accountDownloads: number): Promise<number> {
  if (ctx.tier !== "free") return accountDownloads;
  return countFreeUses(ctx.who, ["pdf_clean"]);
}

export type Allowance = { used: number; limit: number };

/** Everything the UI needs to show "1 of 1 used" style counters. Plain numbers, safe to pass to the browser. */
export type PlanAllowances = {
  tier: LimitTier;
  period: UsagePeriod;
  rewrites: Allowance;
  coverLetters: Allowance;
  atsAnalyst: Allowance;
  interviewSets: Allowance;
  cleanPdfs: Allowance;
  keywordsShown: number;
  trackedJobs: number;
};

export async function planAllowances(user: {
  id: string;
  email?: string | null;
  plan?: string | null;
  created_at?: string | Date | null;
  ai_writing_assist_count?: number | null;
  pdf_download_count?: number | null;
}): Promise<PlanAllowances> {
  const ctx = await usageContext(user);
  const L = PLAN_LIMITS[ctx.tier];
  const [rewrites, coverLetters, atsAnalyst, interviewSets, cleanPdfs] = await Promise.all([
    rewritesUsed(ctx, user.ai_writing_assist_count ?? 0),
    usedSoFar(ctx, "cover_letter"),
    usedSoFar(ctx, "ats_analyst"),
    usedSoFar(ctx, "interview"),
    cleanPdfsUsed(ctx, user.pdf_download_count ?? 0),
  ]);
  return {
    tier: ctx.tier,
    period: L.period,
    rewrites: { used: rewrites, limit: L.maxAiWritingAssists },
    coverLetters: { used: coverLetters, limit: L.coverLetters },
    atsAnalyst: { used: atsAnalyst, limit: L.atsAnalyst },
    interviewSets: { used: interviewSets, limit: L.interviewSets },
    cleanPdfs: { used: cleanPdfs, limit: L.cleanPdfDownloads },
    keywordsShown: L.keywordsShown,
    trackedJobs: L.trackedJobs,
  };
}
