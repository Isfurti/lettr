import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { listAllUsers } from "@/lib/db";
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdmin();
  const { q } = await searchParams;
  const users = await listAllUsers(q);

  return (
    <div className="flex-1 flex app-shell">
      <AdminSidebar />
      <main className="flex-1 px-10 py-10 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display font-semibold text-3xl mb-1">Users</h1>
            <p className="text-ink-soft">{users.length} total</p>
          </div>
          <form method="GET" className="flex gap-2">
            <input
              name="q"
              defaultValue={q}
              placeholder="Search by name or email…"
              className="border border-rule rounded-sm px-3 py-2 text-sm bg-paper-raised w-64 focus:outline-none focus:ring-2 focus:ring-seal/40"
            />
            <button type="submit" className="bg-ink text-white px-4 py-2 rounded-sm text-sm font-medium hover:opacity-90">
              Search
            </button>
          </form>
        </div>

        <div className="paper-sheet rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-ink-soft bg-app-bg">
                <th className="px-6 py-3 font-medium">User</th>
                <th className="px-6 py-3 font-medium">Plan</th>
                <th className="px-6 py-3 font-medium">Resumes</th>
                <th className="px-6 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-ink-soft">
                    No users match &quot;{q}&quot;.
                  </td>
                </tr>
              )}
              {users.map((u) => (
                <tr key={u.id} className="border-t border-rule hover:bg-app-bg/50">
                  <td className="px-6 py-3">
                    <Link href={`/admin/users/${u.id}`} className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-ink text-white text-xs flex items-center justify-center shrink-0">
                        {(u.name || u.email)[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{u.name || "—"}</p>
                        <p className="text-xs text-ink-soft">{u.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded-sm ${u.plan === "pro" ? "bg-seal-soft text-seal-deep" : "bg-rule/40"}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="px-6 py-3">{u.resume_count}</td>
                  <td className="px-6 py-3 text-ink-soft text-xs">{new Date(u.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
