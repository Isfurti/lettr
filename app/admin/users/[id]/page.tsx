import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getUserById, listResumesForUser, listRecentActivity, logAdminAction } from "@/lib/db";
import { scoreResumeQuality } from "@/lib/resume-score";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminUserActions } from "@/components/AdminUserActions";
import type { ResumeData } from "@/lib/types";

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
    <div className="flex-1 flex admin-shell">
      <AdminSidebar />
      <main className="flex-1 px-10 py-10 max-w-4xl">
        <Link href="/admin/users" className="text-sm text-ink-soft hover:text-ink mb-4 inline-block">
          ← Back to Users
        </Link>

        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display font-semibold text-3xl mb-1">{user.name || "—"}</h1>
            <p className="text-ink-soft">{user.email}</p>
            <p className="text-xs text-ink-soft mt-1">
              Joined {new Date(user.created_at).toLocaleDateString()} ·{" "}
              <span className={`font-mono uppercase ${user.plan === "pro" ? "text-admin-accent" : ""}`}>{user.plan}</span>
            </p>
          </div>
          <AdminUserActions userId={id} currentPlan={user.plan} />
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
                  <p className="font-medium text-sm">{r.title}</p>
                  <p className="text-xs text-ink-soft">{r.template} · updated {new Date(r.updated_at).toLocaleDateString()}</p>
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
                <li key={a.id} className="text-sm flex justify-between">
                  <span>{a.action.replace(/_/g, " ")} {a.detail ? `— ${a.detail}` : ""}</span>
                  <span className="text-xs text-ink-soft">{new Date(a.created_at).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
