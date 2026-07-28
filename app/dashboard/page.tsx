import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listResumesForUser, getUserById, listRecentActivity } from "@/lib/db";
import { PLAN_LIMITS, type Plan } from "@/lib/limits";
import { scoreResumeQuality } from "@/lib/resume-score";
import { formatActivityLabel, timeAgo } from "@/lib/activity-format";
import type { ResumeData } from "@/lib/types";
import { AppSidebar } from "@/components/AppSidebar";
import { ScoreRing } from "@/components/ScoreRing";
import { NewResumeButton } from "@/components/NewResumeButton";
import { ImportResumeButton } from "@/components/ImportResumeButton";
import { BillingPortalButton } from "@/components/BillingPortalButton";
import { ResumeSearch } from "@/components/ResumeSearch";
import { VerifyEmailBanner } from "@/components/VerifyEmailBanner";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ drive_connected?: string; drive_error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const [resumeRows, user, recentActivity] = await Promise.all([
    listResumesForUser(userId),
    getUserById(userId),
    listRecentActivity(userId, 5),
  ]);
  const plan = (user?.plan ?? "free") as Plan;
  const resumeLimit = PLAN_LIMITS[plan].maxResumes;
  const atResumeLimit = resumeRows.length >= resumeLimit;
  const { drive_connected, drive_error } = await searchParams;

  const resumes = resumeRows.map((r) => ({ ...r, data: JSON.parse(r.data) as ResumeData }));
  const mostRecent = resumes[0];
  const score = mostRecent ? scoreResumeQuality(mostRecent.data) : null;

  const displayName = session.user.name || session.user.email?.split("@")[0] || "there";
  const initial = displayName[0]?.toUpperCase() ?? "?";

  return (
    <div className="flex-1 flex app-shell">
      <AppSidebar eyebrow="Resume workspace" />

      <main className="flex-1 px-10 py-10 max-w-6xl">
        {user && !user.email_verified && <VerifyEmailBanner />}
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

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display font-semibold text-3xl mb-1">Welcome back, {displayName}.</h1>
            <p className="text-ink-soft">
              {resumes.length === 0
                ? "Let's build your first resume."
                : `You have ${resumes.length} resume${resumes.length === 1 ? "" : "s"} in your workspace.`}
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
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
            <div className="w-9 h-9 rounded-full bg-ink text-white text-sm font-medium flex items-center justify-center">
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
                  Your &quot;{mostRecent.title}&quot; resume
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
                  href={`/builder/${mostRecent.id}`}
                  className="inline-block mt-4 text-sm text-seal font-medium hover:underline"
                >
                  Open full breakdown →
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
                  <Link href={`/builder/${mostRecent.id}`} className="text-sm py-1 hover:text-seal">
                    Write a cover letter →
                  </Link>
                )}
                {plan === "pro" ? (
                  <BillingPortalButton />
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
          resumes={resumes.map((r) => ({
            id: r.id,
            title: r.title,
            template: r.template,
            updated_at: r.updated_at,
            score: scoreResumeQuality(r.data).overall,
          }))}
          atResumeLimit={atResumeLimit}
        />
      </main>
    </div>
  );
}
