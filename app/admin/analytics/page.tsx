import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { getAdminOverview, getTemplatePopularity } from "@/lib/db";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminStatCard, SignupsChart } from "@/components/AdminWidgets";

export const metadata: Metadata = { title: "Analytics | Lettr Admin" };

export default async function AdminAnalyticsPage() {
  const session = await requireAdmin();
  const [overview, templatePopularity] = await Promise.all([
    getAdminOverview(session.user?.email ?? null),
    getTemplatePopularity(),
  ]);

  const users = overview.totalUsers;
  const per = (n: number) => (users === 0 ? "0" : (n / users).toFixed(1));
  // Conversion counts only people actually paying - comped Pro accounts
  // would make this look healthier than it is.
  const conversionRate = users === 0 ? 0 : Math.round((overview.paidProUsers / users) * 100);
  const activeRate = users === 0 ? 0 : Math.round((overview.activeUsers30Days / users) * 100);
  const totalTemplateUsage = templatePopularity.reduce((s, p) => s + p.count, 0);
  const maxTemplateCount = Math.max(1, ...templatePopularity.map((p) => p.count));

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-6xl">
        <h1 className="font-brand font-extrabold text-[36px] tracking-tight mb-1">Analytics</h1>
        <p className="text-ink-soft text-sm mb-8">How people use Lettr. Your own admin account is left out.</p>

        <h2 className="text-xs uppercase tracking-wide text-ink-soft font-medium mb-3">Growth &amp; revenue</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AdminStatCard label="Free → paid conversion" value={`${conversionRate}%`} sub={`${overview.paidProUsers} paying of ${users}`} />
          <AdminStatCard label="New signups" value={overview.signupsLast30Days.toLocaleString()} sub="last 30 days" />
          <AdminStatCard label="Active users (30 days)" value={overview.activeUsers30Days.toLocaleString()} sub={`${activeRate}% of all users`} />
          <AdminStatCard label="Active users (7 days)" value={overview.activeUsers7Days.toLocaleString()} />
        </div>

        <h2 className="text-xs uppercase tracking-wide text-ink-soft font-medium mb-3">Usage</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AdminStatCard label="Resumes" value={overview.totalResumes.toLocaleString()} sub={`${per(overview.totalResumes)} per user`} />
          <AdminStatCard label="PDF downloads" value={overview.pdfDownloadsTotal.toLocaleString()} sub={`${per(overview.pdfDownloadsTotal)} per user`} />
          <AdminStatCard
            label="AI rewrites (free plan)"
            value={overview.aiRewritesTotal.toLocaleString()}
            sub="bullet + summary, counted toward the free limit"
          />
          <AdminStatCard label="Comped Pro accounts" value={overview.compedProUsers.toLocaleString()} sub="Pro without payment" />
        </div>

        <div className="grid lg:grid-cols-2 gap-5">
          <SignupsChart weeks={overview.signupsByWeek} />

          <div className="bg-white border border-rule rounded-xl p-6">
            <p className="font-brand font-extrabold mb-4">Template popularity</p>
            {totalTemplateUsage === 0 ? (
              <p className="text-sm text-ink-soft">No resumes created yet.</p>
            ) : (
              <div className="space-y-3">
                {templatePopularity.map((t) => (
                  <div key={t.template}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="capitalize font-medium">{t.template}</span>
                      <span className="text-ink-soft font-mono">
                        {t.count} · {Math.round((t.count / totalTemplateUsage) * 100)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-sand rounded-full overflow-hidden">
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
