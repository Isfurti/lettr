import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ensureUserRegion } from "@/lib/user-region";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { listResumesForUser, getUserById, listRecentActivity } from "@/lib/db";
import { PLAN_LIMITS, type Plan } from "@/lib/limits";
import { scoreResumeQuality } from "@/lib/resume-score";
import { formatActivityLabel, timeAgo } from "@/lib/activity-format";
import { displayTitle } from "@/lib/resume-title";
import type { ResumeData } from "@/lib/types";
import { AppSidebar } from "@/components/AppSidebar";
import { ScoreRing } from "@/components/ScoreRing";
import { NewResumeButton } from "@/components/NewResumeButton";
import { ImportResumeButton } from "@/components/ImportResumeButton";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { ResumeSearch } from "@/components/ResumeSearch";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";
import { GuestDraftRescue } from "@/components/GuestDraftRescue";
import { DeleteAccountButton } from "@/components/DeleteAccountButton";

export const metadata: Metadata = { title: "Dashboard | Lettr", robots: { index: false } };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ drive_connected?: string; drive_error?: string; import?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const [resumeRows, foundUser, recentActivity, headersList] = await Promise.all([
    listResumesForUser(userId),
    getUserById(userId),
    listRecentActivity(userId, 5),
    headers(),
  ]);
  // Fill in the user's region if it was never saved, so their pricing (and
  // the admin Users/Subscriptions pages) are right from their next visit.
  const user = foundUser ? await ensureUserRegion(foundUser, headersList) : foundUser;
  const plan = (user?.plan ?? "free") as Plan;
  const resumeLimit = PLAN_LIMITS[plan].maxResumes;
  const atResumeLimit = resumeRows.length >= resumeLimit;
  const { drive_connected, drive_error, import: wantsImport } = await searchParams;

  const resumes = resumeRows.map((r) => ({ ...r, data: JSON.parse(r.data) as ResumeData }));
  const scored = resumes.map((r) => ({ ...r, quality: scoreResumeQuality(r.data) }));
  // Spotlight the most recently edited resume that actually has content -
  // a brand-new blank one scoring 0 tells the user nothing.
  const mostRecent = scored.find((r) => r.quality.overall > 0) ?? scored[0];
  const score = mostRecent ? mostRecent.quality : null;
  const isPaidPro = plan === "pro" && Boolean(user?.stripe_subscription_id);

  const rawName = session.user.name || session.user.email?.split("@")[0] || "there";
  // Names typed in lowercase ("sagar agarwal") read better capitalised.
  const displayName = rawName === rawName.toLowerCase() ? rawName.replace(/\b\p{L}/gu, (c) => c.toUpperCase()) : rawName;
  const isAdmin = isAdminEmail(session.user.email);
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex-1 flex flex-col lg:flex-row app-shell">
      <AppSidebar eyebrow="Resume workspace" isAdmin={isAdmin} plan={plan} isPaidPro={isPaidPro} />

      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 max-w-6xl w-full">
        {user && !user.email_verified && <VerifyEmailBanner />}
        <GuestDraftRescue />
        {drive_connected && (
          <div className="mb-6 bg-seal-soft text-seal-deep text-sm rounded-sm px-4 py-3">
            Google Drive connected. You can now save resumes straight to Drive from the builder.
          </div>
        )}
        {drive_error && (
          <div className="mb-6 bg-red-50 text-red-700 text-sm rounded-sm px-4 py-3">
            Couldn&apos;t connect Google Drive ({drive_error}). Please try again.
          </div>
        )}

        {(wantsImport || resumes.length === 0) && !atResumeLimit && (
          <div className="mb-8 paper-sheet rounded-sm p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-l-4 border-seal">
            <div>
              <p className="font-display font-semibold text-lg mb-1">
                {wantsImport ? "Upload your current resume" : "Start with the resume you already have"}
              </p>
              <p className="text-sm text-ink-soft">
                Upload a PDF or Word file and Lettr fills in every section for you. Or start from a blank,
                guided form.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <ImportResumeButton />
              <NewResumeButton label="Start from scratch" />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-semibold text-2xl sm:text-3xl mb-1">Welcome back, {displayName}.</h1>
            <p className="text-ink-soft">
              {resumes.length === 0
                ? "Let's build your first resume."
                : `You have ${resumes.length} resume${resumes.length === 1 ? "" : "s"} in your workspace.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!atResumeLimit ? (
              <>
                <ImportResumeButton />
                <NewResumeButton label="+ New Resume" />
              </>
            ) : (
              <Link href="/pricing" className="bg-ink text-white px-4 py-2.5 rounded-sm text-sm font-medium hover:opacity-90">
                Upgrade for more
              </Link>
            )}
            <div
              title={session.user.email ?? undefined}
              className="hidden sm:flex w-9 h-9 rounded-full bg-ink text-white text-sm font-medium items-center justify-center"
            >
              {initial}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-[1.4fr_1fr] gap-5 mb-10">
          <div className="paper-sheet rounded-sm p-6">
            <p className="text-xs uppercase tracking-wide text-seal font-medium mb-2">✦ Resume Score</p>
            {score && mostRecent ? (
              <>
                <h2 className="font-display font-semibold text-xl mb-3">
                  {displayTitle(mostRecent)}
                </h2>
                <div className="flex items-center gap-6">
                  <ScoreRing value={score.overall} size={96} strokeWidth={7} />
                  <div className="flex-1">
                    <p className="text-sm text-ink-soft mb-3">
                      {score.overall >= 80
                        ? "Strong resume — minor polish left."
                        : score.overall >= 50
                        ? "Solid start — a few gaps to close."
                        : "Early stage — worth filling in more sections."}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {score.sections
                        .filter((s) => s.tips.length === 0)
                        .slice(0, 2)
                        .map((s) => (
                          <span key={s.key} className="text-xs bg-seal-soft text-seal-deep px-2.5 py-1 rounded-full">
                            {s.label} looks good
                          </span>
                        ))}
                    </div>
                  </div>
                </div>
                <Link
                  href={`/builder/${mostRecent.id}?tab=score`}
                  className="inline-block mt-4 text-sm text-seal font-medium hover:underline"
                >
                  {plan === "pro" ? "Open full breakdown →" : "See your next best fix →"}
                </Link>
              </>
            ) : (
              <p className="text-sm text-ink-soft">Create a resume to see your score here.</p>
            )}

            <div className="mt-6 pt-5 border-t border-rule">
              <p className="text-xs uppercase tracking-wide text-ink-soft font-medium mb-3">Quick actions</p>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <Link href="/templates" className="text-sm py-1 hover:text-seal">
                  Browse templates →
                </Link>
                <Link href="/support" className="text-sm py-1 hover:text-seal">
                  Contact support →
                </Link>
                {mostRecent && (
                  <Link href={`/builder/${mostRecent.id}?tab=cover-letter`} className="text-sm py-1 hover:text-seal">
                    Write a cover letter →
                  </Link>
                )}
                {isPaidPro ? (
                  <BillingPortalButton />
                ) : plan === "pro" ? (
                  <span className="text-sm py-1 text-ink-soft">Pro (added by the Lettr team)</span>
                ) : (
                  <Link href="/pricing" className="text-sm py-1 text-seal font-medium">
                    Upgrade to Pro →
                  </Link>
                )}
              </div>
            </div>
          </div>

          <div className="paper-sheet rounded-sm p-6">
            <p className="text-xs uppercase tracking-wide text-ink-soft font-medium mb-3">Recent activity</p>
            {recentActivity.length === 0 ? (
              <p className="text-sm text-ink-soft">Nothing yet — actions you take will show up here.</p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((a) => {
                  const { title, icon } = formatActivityLabel(a.action);
                  return (
                    <li key={a.id} className="flex items-start gap-2.5">
                      <span className="text-seal shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{title}</p>
                        <p className="text-xs text-ink-soft truncate">
                          {timeAgo(a.created_at)} {a.detail ? `· ${a.detail}` : ""}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <ResumeSearch
          resumes={scored.map((r) => ({
            id: r.id,
            title: r.title,
            template: r.template,
            updated_at: r.updated_at,
            score: r.quality.overall,
            data: r.data,
          }))}
          atResumeLimit={atResumeLimit}
        />

        {plan === "free" && user && (
          <section className="mt-10 paper-sheet rounded-sm p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <p className="text-xs uppercase tracking-wide text-ink-soft font-medium">Your free plan</p>
              <Link href="/pricing" className="text-sm text-seal font-medium hover:underline">Get unlimited with Pro →</Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { label: "Resumes", used: resumes.length, limit: PLAN_LIMITS.free.maxResumes },
                { label: "PDF downloads", used: user.pdf_download_count ?? 0, limit: PLAN_LIMITS.free.maxPdfDownloads },
                { label: "AI rewrites", used: user.ai_writing_assist_count ?? 0, limit: PLAN_LIMITS.free.maxAiWritingAssists },
              ].map((u) => {
                const used = Math.min(u.used, u.limit);
                return (
                  <div key={u.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{u.label}</span>
                      <span className="text-ink-soft">
                        {used} of {u.limit} used
                      </span>
                    </div>
                    <div className="h-1.5 bg-rule/40 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${used >= u.limit ? "bg-red-500" : "bg-seal"}`}
                        style={{ width: `${(used / u.limit) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-10 pt-6 border-t border-rule">
          <p className="text-xs uppercase tracking-wide text-ink-soft font-medium mb-3">Account</p>
          <DeleteAccountButton />
        </section>
      </main>
    </div>
  );
}
