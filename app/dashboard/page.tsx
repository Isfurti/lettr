import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { ensureUserRegion } from "@/lib/user-region";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { listResumesForUser, getUserById, listRecentActivity, listInvoicesForUser } from "@/lib/db";
import { formatMoney } from "@/lib/gst";
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
  const [resumeRows, foundUser, recentActivity, headersList, invoices] = await Promise.all([
    listResumesForUser(userId),
    getUserById(userId),
    listRecentActivity(userId, 5),
    headers(),
    listInvoicesForUser(userId),
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

  const tipsLeft = score ? score.sections.reduce((n, s) => n + s.tips.length, 0) : 0;
  const card = "min-w-0 rounded-[28px] p-6 flex flex-col";

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-cream text-ink">
      <AppSidebar
        isAdmin={isAdmin}
        plan={plan}
        isPaidPro={isPaidPro}
        usage={
          plan === "free" && user
            ? { label: "downloads", used: user.pdf_download_count ?? 0, limit: PLAN_LIMITS.free.maxPdfDownloads }
            : undefined
        }
      />

      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1200px] w-full">
        {user && !user.email_verified && <VerifyEmailBanner />}
        <GuestDraftRescue />
        {drive_connected && (
          <div className="mb-6 bg-brand-blue-soft text-brand-blue-deep font-bold rounded-2xl px-5 py-4">
            Google Drive connected. You can now save resumes straight to Drive from the builder.
          </div>
        )}
        {drive_error && (
          <div className="mb-6 bg-red-50 text-red-700 rounded-2xl px-5 py-4">
            Couldn&apos;t connect Google Drive ({drive_error}). Please try again.
          </div>
        )}

        <div className="flex flex-wrap items-end justify-between gap-5 mb-8">
          <div className="min-w-0">
            <h1 className="font-brand font-extrabold text-[34px] sm:text-[44px] leading-[1.05] tracking-tight">
              Welcome back, {displayName.split(" ")[0]}.
            </h1>
            <p className="mt-2 text-lg text-slate">
              {resumes.length === 0
                ? "Let's build your first resume."
                : score && score.overall >= 90
                ? "Your best resume is in great shape."
                : tipsLeft > 0
                ? `${tipsLeft} quick fix${tipsLeft === 1 ? "" : "es"} left on your best resume.`
                : `You have ${resumes.length} resume${resumes.length === 1 ? "" : "s"} in your workspace.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {!atResumeLimit ? (
              <>
                <ImportResumeButton />
                <NewResumeButton label="New resume" />
              </>
            ) : (
              <Link
                href="/pricing"
                className="btn-press inline-flex items-center min-h-11 px-5 rounded-full bg-gold text-ink font-extrabold shadow-[0_4px_0_var(--gold-deep)]"
              >
                Upgrade for more resumes
              </Link>
            )}
            <div
              title={session.user.email ?? undefined}
              className="hidden sm:flex w-11 h-11 rounded-full bg-ink text-gold font-brand font-extrabold items-center justify-center"
            >
              {initial}
            </div>
          </div>
        </div>

        {(wantsImport || resumes.length === 0) && !atResumeLimit && (
          <div className="mb-8 bg-white border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <p className="font-brand font-extrabold text-2xl">
                {wantsImport ? "Upload your current resume" : "Start with the resume you already have"}
              </p>
              <p className="mt-1 text-slate">
                Upload a PDF or Word file, or your LinkedIn profile saved as a PDF, and Lettr fills in every section for you.
                Or start from a blank, guided form.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <ImportResumeButton />
              <Link
                href="/resume-checker?from=linkedin"
                className="btn-press inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-white border-2 border-ink text-[15px] font-bold"
              >
                From LinkedIn
              </Link>
              <Link
                href="/examples"
                className="btn-press inline-flex items-center justify-center min-h-11 px-5 rounded-full bg-white border-2 border-ink text-[15px] font-bold"
              >
                Start from an example
              </Link>
              <NewResumeButton label="Start from scratch" />
            </div>
          </div>
        )}

        {mostRecent && (
          <div className="grid md:grid-cols-2 xl:grid-cols-[1.35fr_1fr_1fr] gap-5 mb-12">
            <div className={`${card} bg-white border-2 border-ink shadow-[6px_6px_0_var(--ink)] md:col-span-2 xl:col-span-1`}>
              <div className="flex items-center gap-4 sm:gap-6">
                <ScoreRing value={score?.overall ?? 0} size={112} strokeWidth={10} />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate">Your best resume</p>
                  <h2 className="font-brand font-extrabold text-2xl leading-tight line-clamp-2 break-words">{displayTitle(mostRecent)}</h2>
                  <p className="mt-1 text-slate">
                    {score && score.overall >= 80
                      ? "Strong resume. Minor polish left."
                      : score && score.overall >= 50
                      ? "Solid start. A few gaps to close."
                      : "Early stage. Worth filling in more sections."}
                  </p>
                  <Link
                    href={`/builder/${mostRecent.id}?tab=score`}
                    className="btn-press mt-3 inline-flex items-center whitespace-nowrap min-h-11 px-5 rounded-full bg-brand-blue text-white font-bold shadow-[0_4px_0_var(--brand-blue-deep)]"
                  >
                    {plan === "pro" ? "Full breakdown" : "Fix next tip"}
                  </Link>
                </div>
              </div>
            </div>

            <div className={`${card} bg-brand-blue-soft`}>
              <p className="font-extrabold text-brand-blue-deep">Applying somewhere new?</p>
              <p className="mt-2 text-slate leading-relaxed flex-1">
                Paste the job post and see your match score and the keywords you&apos;re missing.
              </p>
              <Link
                href={`/builder/${mostRecent.id}?tab=match`}
                className="btn-press mt-4 self-start inline-flex items-center min-h-11 px-5 rounded-full bg-brand-blue text-white font-bold shadow-[0_4px_0_var(--brand-blue-deep)]"
              >
                Check my match
              </Link>
            </div>

            <div className={`${card} bg-gold-soft`}>
              <p className="font-extrabold flex items-center gap-2">
                Need a cover letter?
                {plan !== "pro" && <span className="bg-ink text-gold text-xs font-extrabold px-2 py-0.5 rounded-full">Pro</span>}
              </p>
              <p className="mt-2 text-slate leading-relaxed flex-1">
                Lettr writes one from your resume and the job post, in the tone you choose.
              </p>
              <Link
                href={`/builder/${mostRecent.id}?tab=cover-letter`}
                className="btn-press mt-4 self-start inline-flex items-center min-h-11 px-5 rounded-full bg-gold text-ink font-extrabold shadow-[0_4px_0_var(--gold-deep)]"
              >
                Write a cover letter
              </Link>
            </div>
          </div>
        )}

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

        <div className={`mt-12 grid gap-5 ${plan === "free" && user ? "lg:grid-cols-2" : ""}`}>
          <section className="bg-white rounded-[28px] border border-rule p-6">
            <h2 className="font-brand font-extrabold text-2xl mb-4">Recently</h2>
            {recentActivity.length === 0 ? (
              <p className="text-slate">Nothing yet. What you do in Lettr will show up here.</p>
            ) : (
              <ul className="space-y-4">
                {recentActivity.map((a) => {
                  const { title, icon } = formatActivityLabel(a.action);
                  return (
                    <li key={a.id} className="flex items-center gap-3">
                      <span aria-hidden="true" className="w-9 h-9 shrink-0 rounded-full bg-brand-blue-soft text-brand-blue flex items-center justify-center">
                        {icon}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold truncate">{title}</p>
                        {a.detail && <p className="text-sm text-slate truncate">{a.detail}</p>}
                      </div>
                      <span className="text-sm text-slate shrink-0">{timeAgo(a.created_at)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {plan === "free" && user && (
            <section className="bg-white rounded-[28px] border border-rule p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
                <h2 className="font-brand font-extrabold text-2xl">Your free plan</h2>
                <Link href="/pricing" className="inline-flex items-center min-h-11 font-bold text-brand-blue hover:underline">
                  Get unlimited with Pro
                </Link>
              </div>
              <div className="space-y-5">
                {[
                  { label: "Resumes", used: resumes.length, limit: PLAN_LIMITS.free.maxResumes },
                  { label: "PDF downloads", used: user.pdf_download_count ?? 0, limit: PLAN_LIMITS.free.maxPdfDownloads },
                  { label: "AI rewrites", used: user.ai_writing_assist_count ?? 0, limit: PLAN_LIMITS.free.maxAiWritingAssists },
                ].map((u) => {
                  const used = Math.min(u.used, u.limit);
                  return (
                    <div key={u.label}>
                      <div className="flex justify-between mb-1.5">
                        <span className="font-bold">{u.label}</span>
                        <span className="text-slate">
                          {used} of {u.limit} used
                        </span>
                      </div>
                      <div className="h-2.5 bg-sand rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${used >= u.limit ? "bg-red-500" : "bg-brand-blue"}`}
                          style={{ width: `${(used / u.limit) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {isPaidPro || plan === "pro" ? (
          <section className="mt-5 bg-white rounded-[28px] border border-rule p-6 flex flex-wrap items-center justify-between gap-3">
            <p className="font-bold">
              {isPaidPro ? "You're on Pro." : "You're on Pro (added by the Lettr team)."}
            </p>
            {isPaidPro && <BillingPortalButton />}
          </section>
        ) : null}

        {invoices.length > 0 && (
          <section className="mt-5 bg-white rounded-[28px] border border-rule p-6">
            <h2 className="font-brand font-extrabold text-2xl mb-4">Invoices</h2>
            <ul className="divide-y divide-rule">
              {invoices.map((inv) => (
                <li key={inv.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="font-bold">{inv.number}</p>
                    <p className="text-sm text-slate">
                      {new Date(inv.issued_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                      {inv.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{formatMoney(inv.total, inv.currency)}</span>
                    <a href={`/api/invoices/${inv.id}/pdf`} className="inline-flex items-center min-h-11 font-bold text-brand-blue hover:underline">
                      Download PDF
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-12 pt-6 border-t border-rule">
          <p className="text-sm font-bold text-slate mb-3">Account</p>
          <DeleteAccountButton />
        </section>
      </main>
    </div>
  );
}
