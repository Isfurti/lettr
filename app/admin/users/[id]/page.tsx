import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import type { Metadata } from "next";
import { getUserById, listResumesForUser, listRecentActivity, logAdminAction } from "@/lib/db";
import { scoreResumeQuality } from "@/lib/resume-score";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminUserActions } from "@/components/AdminUserActions";
import type { ResumeData } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/format-date";
import { getDisplayPriceForUser } from "@/lib/pricing-region";
import { isAdminEmail } from "@/lib/admin-auth";
import { PlanBadge } from "@/components/AdminWidgets";
import { displayTitle } from "@/lib/resume-title";

export const metadata: Metadata = { title: "User | Lettr Admin" };

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  const { id } = await params;

  const user = await getUserById(id);
  if (!user) notFound();

  const [resumeRows, activity] = await Promise.all([listResumesForUser(id), listRecentActivity(id, 10)]);

  // Viewing a user's data is itself a real access event - log it, same as
  // any other admin action, per the audit policy in ARCHITECTURE.md.
  await logAdminAction({
    adminUserId: (session.user as { id: string }).id,
    action: "viewed_user",
    targetUserId: id,
    detail: user.email,
  });

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-4xl">
        <Link href="/admin/users" className="text-sm text-ink-soft hover:text-ink mb-4 inline-block">
          ← Back to Users
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div className="min-w-0">
            <h1 className="font-display font-semibold text-3xl mb-1">{user.name || "—"}</h1>
            <p className="text-ink-soft break-all">{user.email}</p>
            <p className="text-xs text-ink-soft mt-2 flex flex-wrap items-center gap-2">
              <PlanBadge plan={user.plan} paid={Boolean(user.stripe_subscription_id)} />
              <span>Joined {formatDate(user.created_at)}</span>
              <span>·</span>
              {user.email_verified ? (
                <span className="text-green-700">Email verified</span>
              ) : (
                <span className="text-admin-accent">Email NOT verified</span>
              )}
            </p>
          </div>
          <AdminUserActions
            userId={id}
            currentPlan={user.plan}
            emailVerified={user.email_verified}
            hasPaidSubscription={Boolean(user.stripe_subscription_id)}
            isSelf={isAdminEmail(user.email)}
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
          {[
            { label: "Region · price", value: user.country_code ? `${user.country_code} · ${getDisplayPriceForUser(user).display}` : "Not detected" },
            { label: "PDF downloads", value: String(user.pdf_download_count ?? 0) },
            { label: "AI rewrites (free)", value: user.plan === "pro" ? "—" : `${user.ai_writing_assist_count ?? 0} of 5` },
            { label: "Last active", value: activity[0] ? formatDate(activity[0].created_at) : "—" },
          ].map((stat) => (
            <div key={stat.label} className="paper-sheet rounded-sm p-3">
              <p className="text-[10px] uppercase tracking-wide text-ink-soft">{stat.label}</p>
              <p className="text-sm font-medium mt-0.5">{stat.value}</p>
            </div>
          ))}
        </div>

        <h2 className="font-display font-semibold text-lg mb-3">Resumes ({resumeRows.length})</h2>
        <div className="space-y-2 mb-10">
          {resumeRows.length === 0 && <p className="text-sm text-ink-soft">No resumes yet.</p>}
          {resumeRows.map((r) => {
            const data = JSON.parse(r.data) as ResumeData;
            const score = scoreResumeQuality(data);
            return (
              <Link
                key={r.id}
                href={`/admin/users/${id}/resumes/${r.id}`}
                className="paper-sheet rounded-sm p-4 flex items-center justify-between hover:-translate-y-0.5 transition-transform"
              >
                <div>
                  <p className="font-medium text-sm">{displayTitle({ title: r.title, data })}</p>
                  <p className="text-xs text-ink-soft capitalize">{r.template} · updated {formatDate(r.updated_at)}</p>
                </div>
                <span className="text-xs font-mono bg-admin-accent-soft text-admin-accent-deep px-2 py-0.5 rounded-sm">{score.overall}</span>
              </Link>
            );
          })}
        </div>

        <h2 className="font-display font-semibold text-lg mb-3">Recent activity</h2>
        <div className="paper-sheet rounded-sm p-4">
          {activity.length === 0 ? (
            <p className="text-sm text-ink-soft">No recorded activity.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((a) => (
                <li key={a.id} className="text-sm flex justify-between gap-3">
                  <span>{a.action.replace(/_/g, " ")} {a.detail ? `— ${a.detail}` : ""}</span>
                  <span className="text-xs text-ink-soft shrink-0 ml-3">{formatDateTime(a.created_at)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
