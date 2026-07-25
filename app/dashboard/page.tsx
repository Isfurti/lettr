import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listResumesForUser, getUserById } from "@/lib/db";
import { PLAN_LIMITS, type Plan } from "@/lib/limits";
import { scoreResumeQuality } from "@/lib/resume-score";
import type { ResumeData } from "@/lib/types";
import { AppSidebar } from "@/components/AppSidebar";
import { ScoreRing } from "@/components/ScoreRing";
import { NewResumeButton } from "@/components/NewResumeButton";
import { BillingPortalButton } from "@/components/BillingPortalButton";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ drive_connected?: string; drive_error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const [resumeRows, user] = await Promise.all([listResumesForUser(userId), getUserById(userId)]);
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
              <NewResumeButton label="+ New Resume" />
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
          </div>

          <div className="paper-sheet rounded-sm p-6">
            <p className="text-xs uppercase tracking-wide text-ink-soft font-medium mb-3">Quick actions</p>
            <div className="space-y-1">
              <Link href="/templates" className="block text-sm py-2 hover:text-seal">
                Browse templates →
              </Link>
              <Link href="/support" className="block text-sm py-2 hover:text-seal">
                Contact support →
              </Link>
              {plan === "pro" ? (
                <div className="pt-1">
                  <BillingPortalButton />
                </div>
              ) : (
                <Link href="/pricing" className="block text-sm py-2 text-seal font-medium">
                  Upgrade to Pro →
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display font-semibold text-xl">My Resumes</h2>
        </div>

        {resumes.length === 0 ? (
          <div className="paper-sheet rounded-sm p-10 text-center">
            <p className="text-ink-soft mb-4">You haven&apos;t created a resume yet.</p>
            <NewResumeButton label="Create your first resume" />
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {resumes.map((r) => {
              const s = scoreResumeQuality(r.data);
              return (
                <Link
                  key={r.id}
                  href={`/builder/${r.id}`}
                  className="paper-sheet rounded-sm p-4 hover:-translate-y-0.5 transition-transform"
                >
                  <div className="aspect-[3/4] bg-app-bg rounded-sm mb-3 p-3 flex flex-col gap-1.5 overflow-hidden">
                    <div className="h-2 w-3/5 bg-ink/70 rounded-sm" />
                    <div className="h-1.5 w-2/5 bg-ink-soft/40 rounded-sm mb-1" />
                    {[1, 0.9, 0.7, 0.85, 0.6, 0.75].map((w, i) => (
                      <div key={i} className="h-1 bg-ink-soft/20 rounded-sm" style={{ width: `${w * 100}%` }} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-sm truncate">{r.title}</p>
                    <span className="text-xs font-mono bg-seal-soft text-seal-deep px-1.5 py-0.5 rounded-sm shrink-0 ml-2">
                      {s.overall}
                    </span>
                  </div>
                  <p className="text-xs text-ink-soft mt-1">
                    Updated {new Date(r.updated_at).toLocaleDateString()} · {r.template}
                  </p>
                </Link>
              );
            })}
            {!atResumeLimit && (
              <NewResumeCard />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function NewResumeCard() {
  return (
    <div className="border-2 border-dashed border-rule rounded-sm aspect-[3/4] flex items-center justify-center">
      <NewResumeButton label="+ Create New" />
    </div>
  );
}
