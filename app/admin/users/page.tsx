import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllUsers, type AdminUserRow } from "@/lib/db";
import { getDisplayPriceForUser } from "@/lib/pricing-region";
import { formatDate } from "@/lib/format-date";
import { timeAgo } from "@/lib/activity-format";
import { AdminSidebar } from "@/components/AdminSidebar";
import { PlanBadge } from "@/components/AdminWidgets";

export const metadata: Metadata = { title: "Users | Lettr Admin" };

const SORTS = {
  joined: { label: "Newest", fn: (a: AdminUserRow, b: AdminUserRow) => +new Date(b.created_at) - +new Date(a.created_at) },
  active: {
    label: "Last active",
    fn: (a: AdminUserRow, b: AdminUserRow) => +new Date(b.last_active ?? 0) - +new Date(a.last_active ?? 0),
  },
  resumes: { label: "Most resumes", fn: (a: AdminUserRow, b: AdminUserRow) => b.resume_count - a.resume_count },
  pdfs: { label: "Most downloads", fn: (a: AdminUserRow, b: AdminUserRow) => b.pdf_download_count - a.pdf_download_count },
} as const;
type SortKey = keyof typeof SORTS;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; sort?: string; plan?: string }>;
}) {
  await requireAdmin();
  const { q, sort, plan } = await searchParams;
  const sortKey: SortKey = sort && sort in SORTS ? (sort as SortKey) : "joined";

  let users = await listAllUsers(q);
  if (plan === "paid") users = users.filter((u) => u.plan === "pro" && u.stripe_subscription_id);
  if (plan === "comp") users = users.filter((u) => u.plan === "pro" && !u.stripe_subscription_id);
  if (plan === "free") users = users.filter((u) => u.plan !== "pro");
  users = [...users].sort(SORTS[sortKey].fn);

  const qs = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged = { q, sort: sortKey, plan, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    return `/admin/users?${p.toString()}`;
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="font-brand font-extrabold text-[36px] tracking-tight mb-1">Users</h1>
            <p className="text-ink-soft text-sm">{users.length} shown</p>
          </div>
          <form method="GET" className="flex gap-2 w-full sm:w-auto">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name or email…"
              aria-label="Search users"
              className="border border-rule rounded-xl px-3 py-2 text-sm bg-white flex-1 sm:w-64 focus:outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
            <input type="hidden" name="sort" value={sortKey} />
            {plan && <input type="hidden" name="plan" value={plan} />}
            <button type="submit" className="bg-ink text-white px-4 py-2 rounded-xl text-sm font-medium hover:opacity-90">
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4 text-xs">
          <span className="text-ink-soft">Show:</span>
          {[
            { key: undefined, label: "All" },
            { key: "paid", label: "Paying Pro" },
            { key: "comp", label: "Comped Pro" },
            { key: "free", label: "Free" },
          ].map((f) => (
            <Link
              key={f.label}
              href={qs({ plan: f.key })}
              className={plan === f.key ? "font-semibold text-ink underline" : "text-ink-soft hover:text-ink"}
            >
              {f.label}
            </Link>
          ))}
          <span className="text-ink-soft ml-auto">Sort:</span>
          {(Object.keys(SORTS) as SortKey[]).map((k) => (
            <Link
              key={k}
              href={qs({ sort: k })}
              className={sortKey === k ? "font-semibold text-ink underline" : "text-ink-soft hover:text-ink"}
            >
              {SORTS[k].label}
            </Link>
          ))}
        </div>

        <div className="bg-white border border-rule rounded-xl overflow-x-auto">
          <table className="w-full text-sm min-w-[860px]">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-soft bg-sand">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Region · price</th>
                <th className="px-5 py-3 font-medium text-right">Resumes</th>
                <th className="px-5 py-3 font-medium text-right">PDFs</th>
                <th className="px-5 py-3 font-medium text-right">AI uses</th>
                <th className="px-5 py-3 font-medium">Last active</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-ink-soft">
                    {q ? <>No users match &quot;{q}&quot;.</> : "No users here yet."}
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-t border-rule hover:bg-sand/60">
                  <td className="px-5 py-3">
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
                  <td className="px-5 py-3">
                    <PlanBadge plan={u.plan} paid={Boolean(u.stripe_subscription_id)} />
                  </td>
                  <td className="px-5 py-3 text-xs whitespace-nowrap">
                    {u.country_code ? (
                      <span className="font-mono">
                        {u.country_code} · {getDisplayPriceForUser(u).display}
                      </span>
                    ) : (
                      <span className="text-ink-soft" title="Detected automatically on their next visit">
                        Not detected yet
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right font-mono">{u.resume_count}</td>
                  <td className="px-5 py-3 text-right font-mono">{u.pdf_download_count}</td>
                  <td className="px-5 py-3 text-right font-mono">{u.plan === "pro" ? "—" : u.ai_writing_assist_count}</td>
                  <td className="px-5 py-3 text-xs text-ink-soft whitespace-nowrap">{u.last_active ? timeAgo(u.last_active) : "—"}</td>
                  <td className="px-5 py-3 text-xs text-ink-soft whitespace-nowrap">{formatDate(u.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-ink-soft mt-3">
          AI uses are only counted on the free plan (it&apos;s what the 5-rewrite limit is based on).
        </p>
      </main>
    </div>
  );
}
