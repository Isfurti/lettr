import { requireAdmin } from "@/lib/admin-auth";
import { getAdminOverview, listRecentUsers } from "@/lib/db";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminOverviewPage() {
  await requireAdmin();

  const [overview, recentUsers] = await Promise.all([getAdminOverview(), listRecentUsers(6)]);

  const proPercent = overview.totalUsers === 0 ? 0 : Math.round((overview.proUsers / overview.totalUsers) * 100);
  const maxWeekCount = Math.max(1, ...overview.signupsByWeek.map((w) => w.count));

  return (
    <div className="flex-1 flex app-shell">
      <AdminSidebar />

      <main className="flex-1 px-10 py-10 max-w-6xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-display font-semibold text-3xl mb-1">Overview</h1>
            <p className="text-ink-soft">Real usage data for the Lettr platform — no estimates.</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-seal font-medium">System status</p>
            <p className="text-sm font-medium flex items-center gap-1.5 justify-end mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> Operational
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total users" value={overview.totalUsers.toLocaleString()} />
          <StatCard label="Pro subscribers" value={overview.proUsers.toLocaleString()} sub={`${proPercent}% of users`} />
          <StatCard label="Total resumes" value={overview.totalResumes.toLocaleString()} />
          <StatCard label="Open support tickets" value={overview.openSupportCount.toLocaleString()} />
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 mb-10">
          <div className="paper-sheet rounded-sm p-6">
            <p className="font-display font-semibold mb-4">Signups per week</p>
            {overview.signupsByWeek.length === 0 ? (
              <p className="text-sm text-ink-soft">No signups in the last 8 weeks yet.</p>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {overview.signupsByWeek.map((w) => (
                  <div key={w.week} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-seal rounded-t-sm"
                      style={{ height: `${Math.max(4, (w.count / maxWeekCount) * 130)}px` }}
                      title={`${w.count} signups`}
                    />
                    <span className="text-[10px] text-ink-soft font-mono">{w.week.slice(5)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="paper-sheet rounded-sm p-6">
            <p className="font-display font-semibold mb-4">Plan distribution</p>
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg viewBox="0 0 80 80" className="w-28 h-28 -rotate-90">
                <circle cx="40" cy="40" r="34" fill="none" className="score-ring-track" strokeWidth="10" />
                <circle
                  cx="40" cy="40" r="34" fill="none" className="score-ring-fill" strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 34 * (proPercent / 100)} ${2 * Math.PI * 34}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono font-semibold text-xl">{proPercent}%</span>
                <span className="text-[9px] uppercase text-ink-soft">Pro</span>
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-seal inline-block" /> Pro</span>
                <span className="font-mono">{overview.proUsers}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-rule inline-block" /> Free</span>
                <span className="font-mono">{overview.freeUsers}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="paper-sheet rounded-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-rule">
            <p className="font-display font-semibold">Recent signups</p>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-ink-soft px-6 py-6">No users yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-ink-soft bg-app-bg">
                  <th className="px-6 py-3 font-medium">User</th>
                  <th className="px-6 py-3 font-medium">Plan</th>
                  <th className="px-6 py-3 font-medium">Signed up</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((u) => (
                  <tr key={u.id} className="border-t border-rule">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-ink text-white text-xs flex items-center justify-center shrink-0">
                          {(u.name || u.email)[0]?.toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium">{u.name || "—"}</p>
                          <p className="text-xs text-ink-soft">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded-sm ${u.plan === "pro" ? "bg-seal-soft text-seal-deep" : "bg-rule/40"}`}>
                        {u.plan}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-ink-soft text-xs">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="paper-sheet rounded-sm p-5 border-t-2 border-t-seal">
      <p className="text-xs uppercase tracking-wide text-ink-soft mb-1">{label}</p>
      <p className="font-display font-semibold text-2xl">{value}</p>
      {sub && <p className="text-xs text-ink-soft mt-1">{sub}</p>}
    </div>
  );
}
