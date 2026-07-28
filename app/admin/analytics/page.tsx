import { requireAdmin } from "@/lib/admin-auth";
import { getAdminOverview, getTemplatePopularity } from "@/lib/db";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminAnalyticsPage() {
  await requireAdmin();
  const [overview, templatePopularity] = await Promise.all([getAdminOverview(), getTemplatePopularity()]);

  const conversionRate = overview.totalUsers === 0 ? 0 : Math.round((overview.proUsers / overview.totalUsers) * 100);
  const avgResumesPerUser = overview.totalUsers === 0 ? 0 : (overview.totalResumes / overview.totalUsers).toFixed(1);
  const maxWeekCount = Math.max(1, ...overview.signupsByWeek.map((w) => w.count));
  const totalTemplateUsage = templatePopularity.reduce((s, p) => s + p.count, 0);
  const maxTemplateCount = Math.max(1, ...templatePopularity.map((p) => p.count));

  return (
    <div className="flex-1 flex admin-shell">
      <AdminSidebar />
      <main className="flex-1 px-10 py-10 max-w-6xl">
        <h1 className="font-display font-semibold text-3xl mb-1">Analytics</h1>
        <p className="text-ink-soft mb-8">All figures computed live from the database.</p>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Free → Pro conversion" value={`${conversionRate}%`} />
          <StatCard label="Avg. resumes / user" value={String(avgResumesPerUser)} />
          <StatCard label="Total resumes" value={overview.totalResumes.toLocaleString()} />
          <StatCard label="Open support tickets" value={overview.openSupportCount.toLocaleString()} />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <div className="paper-sheet rounded-sm p-6">
            <p className="font-display font-semibold mb-4">Signups per week</p>
            {overview.signupsByWeek.length === 0 ? (
              <p className="text-sm text-ink-soft">No signups in the last 8 weeks yet.</p>
            ) : (
              <div className="flex items-end gap-3 h-40">
                {overview.signupsByWeek.map((w) => (
                  <div key={w.week} className="flex-1 flex flex-col items-center gap-2">
                    <div
                      className="w-full bg-admin-accent rounded-t-sm"
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
            <p className="font-display font-semibold mb-4">Template popularity</p>
            {totalTemplateUsage === 0 ? (
              <p className="text-sm text-ink-soft">No resumes created yet.</p>
            ) : (
              <div className="space-y-3">
                {templatePopularity.map((t) => (
                  <div key={t.template}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize font-medium">{t.template}</span>
                      <span className="text-ink-soft font-mono">{t.count}</span>
                    </div>
                    <div className="h-1.5 bg-app-bg rounded-full overflow-hidden">
                      <div className="h-full bg-admin-accent rounded-full" style={{ width: `${(t.count / maxTemplateCount) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="paper-sheet rounded-sm p-5 border-t-2 border-t-admin-accent">
      <p className="text-xs uppercase tracking-wide text-ink-soft mb-1">{label}</p>
      <p className="font-display font-semibold text-2xl">{value}</p>
    </div>
  );
}
