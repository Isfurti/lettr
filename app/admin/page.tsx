import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import pool, { getAdminOverview, listRecentUsers } from "@/lib/db";
import { getStripeStatus } from "@/lib/integrations";
import { formatDate } from "@/lib/format-date";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminStatCard, SignupsChart, PaymentsWarning, PlanBadge } from "@/components/AdminWidgets";

export const metadata: Metadata = { title: "Overview | Lettr Admin" };

async function dbOk(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}

export default async function AdminOverviewPage() {
  const session = await requireAdmin();
  const adminEmail = session.user?.email ?? null;

  const [overview, recentUsers, databaseOk] = await Promise.all([
    getAdminOverview(adminEmail),
    listRecentUsers(8),
    dbOk(),
  ]);
  const stripe = getStripeStatus();
  const healthy = databaseOk && stripe.ready && Boolean(process.env.ANTHROPIC_API_KEY);

  const pct = (n: number) => (overview.totalUsers === 0 ? 0 : Math.round((n / overview.totalUsers) * 100));
  const segments = [
    { label: "Pro · paid", count: overview.paidProUsers, color: "#15803d" },
    { label: "Pro · comp", count: overview.compedProUsers, color: "#d97706" },
    { label: "Free", count: overview.freeUsers, color: "#d6d3cb" },
  ];
  const circumference = 2 * Math.PI * 34;
  let offset = 0;

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />

      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="font-display font-semibold text-3xl mb-1">Overview</h1>
            <p className="text-ink-soft text-sm">Live numbers from the database. Your own admin account is left out.</p>
          </div>
          <Link href="/admin/system" className="text-right">
            <p className="text-xs uppercase tracking-wide text-ink-soft font-medium">System status</p>
            <p className="text-sm font-medium flex items-center gap-1.5 justify-end mt-1">
              <span className={`w-2 h-2 rounded-full inline-block ${healthy ? "bg-green-500" : databaseOk ? "bg-amber-500" : "bg-red-500"}`} />
              {healthy ? "All systems ready" : databaseOk ? "Needs setup" : "Database error"}
            </p>
          </Link>
        </div>

        {!stripe.ready && <PaymentsWarning missing={stripe.missing} />}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <AdminStatCard
            label="Users"
            value={overview.totalUsers.toLocaleString()}
            sub={`+${overview.signupsLast30Days} in the last 30 days`}
          />
          <AdminStatCard
            label="Paying Pro"
            value={overview.paidProUsers.toLocaleString()}
            sub={`${pct(overview.paidProUsers)}% of users · ${overview.compedProUsers} comped`}
          />
          <AdminStatCard
            label="Active users"
            value={overview.activeUsers7Days.toLocaleString()}
            sub={`last 7 days · ${overview.activeUsers30Days} in 30 days`}
          />
          <AdminStatCard
            label="Open support tickets"
            value={overview.openSupportCount.toLocaleString()}
            sub={overview.openSupportCount > 0 ? "Needs a reply" : "All caught up"}
          />
        </div>

        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-5 mb-10">
          <SignupsChart weeks={overview.signupsByWeek} />

          <div className="paper-sheet rounded-sm p-6">
            <p className="font-display font-semibold mb-4">Plans</p>
            <div className="relative w-28 h-28 mx-auto mb-4">
              <svg viewBox="0 0 80 80" className="w-28 h-28 -rotate-90" aria-hidden="true">
                <circle cx="40" cy="40" r="34" fill="none" stroke="#efece4" strokeWidth="10" />
                {overview.totalUsers > 0 &&
                  segments.map((seg) => {
                    const len = (seg.count / overview.totalUsers) * circumference;
                    const el = (
                      <circle
                        key={seg.label}
                        cx="40" cy="40" r="34" fill="none" stroke={seg.color} strokeWidth="10"
                        strokeDasharray={`${len} ${circumference}`}
                        strokeDashoffset={-offset}
                      />
                    );
                    offset += len;
                    return el;
                  })}
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-mono font-semibold text-xl">{pct(overview.paidProUsers)}%</span>
                <span className="text-[9px] uppercase text-ink-soft">paying</span>
              </span>
            </div>
            <div className="space-y-1.5 text-sm">
              {segments.map((seg) => (
                <div key={seg.label} className="flex justify-between">
                  <span className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: seg.color }} /> {seg.label}
                  </span>
                  <span className="font-mono">{seg.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="paper-sheet rounded-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-rule flex items-center justify-between">
            <p className="font-display font-semibold">Recent signups</p>
            <Link href="/admin/users" className="text-xs text-admin-accent hover:underline">All users →</Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-ink-soft px-6 py-6">No users yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[480px]">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-ink-soft bg-app-bg">
                    <th className="px-6 py-3 font-medium">User</th>
                    <th className="px-6 py-3 font-medium">Plan</th>
                    <th className="px-6 py-3 font-medium">Signed up</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.map((u) => (
                    <tr key={u.id} className="border-t border-rule hover:bg-app-bg/50">
                      <td className="px-6 py-3">
                        <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded-full bg-ink text-white text-xs flex items-center justify-center shrink-0">
                            {(u.name || u.email)[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium truncate">{u.name || "—"}</p>
                            <p className="text-xs text-ink-soft truncate">{u.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-6 py-3">
                        <PlanBadge plan={u.plan} paid={Boolean(u.stripe_subscription_id)} />
                      </td>
                      <td className="px-6 py-3 text-ink-soft text-xs">{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
