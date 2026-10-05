import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/AdminSidebar";
import pool, { listAdminAuditLog } from "@/lib/db";
import type { Metadata } from "next";
import { getIntegrations } from "@/lib/integrations";
import { formatDateTime } from "@/lib/format-date";

export const metadata: Metadata = { title: "System | Lettr Admin" };

async function checkDb(): Promise<{ ok: boolean; error?: string }> {
  try {
    await pool.query("SELECT 1");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

export default async function AdminSystemPage() {
  await requireAdmin();
  const [db, auditLog] = await Promise.all([checkDb(), listAdminAuditLog(25)]);

  const integrations = getIntegrations();

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-3xl">
        <h1 className="font-brand font-extrabold text-[36px] tracking-tight mb-1">System</h1>
        <p className="text-ink-soft mb-8">Live configuration status — nothing here is cached or estimated.</p>

        <div className="bg-white border border-rule rounded-xl p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="font-medium">Database</p>
            <p className="text-xs text-ink-soft">{db.ok ? "Connected" : db.error}</p>
          </div>
          <span className={`text-xs font-mono uppercase px-2.5 py-1 rounded-xl ${db.ok ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
            {db.ok ? "Operational" : "Error"}
          </span>
        </div>

        <div className="bg-white border border-rule rounded-xl overflow-hidden">
          <div className="px-6 py-3 border-b border-rule">
            <p className="text-xs uppercase tracking-wide text-ink-soft font-medium">Integrations</p>
          </div>
          {integrations.map((i) => (
            <div key={i.name} className="flex items-start justify-between gap-3 px-6 py-3 border-b border-rule last:border-b-0">
              <div className="min-w-0">
                <p className="text-sm">{i.name}</p>
                {"note" in i && i.note && <p className="text-xs text-red-700 mt-0.5 break-words">{i.note}</p>}
              </div>
              <span
                className={`text-xs font-mono uppercase px-2 py-0.5 rounded-xl shrink-0 ${
                  i.configured
                    ? "bg-green-50 text-green-800"
                    : i.critical
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-800"
                }`}
              >
                {i.configured ? "Configured" : i.critical ? "Missing — needed" : "Not set"}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-soft mt-4 mb-8">
          &quot;Configured&quot; only checks that the environment variable is present — it doesn&apos;t verify the
          credential is valid. Check{" "}
          <a href="/api/health" target="_blank" rel="noreferrer" className="text-admin-accent hover:underline">
            /api/health
          </a>{" "}
          directly for the raw JSON, or an uptime monitor for continuous checks.
        </p>

        <div className="bg-white border border-rule rounded-xl overflow-hidden">
          <div className="px-6 py-3 border-b border-rule">
            <p className="text-xs uppercase tracking-wide text-ink-soft font-medium">Admin audit log</p>
            <p className="text-xs text-ink-soft mt-0.5">Every admin action that touched a user's data.</p>
          </div>
          {auditLog.length === 0 ? (
            <p className="text-sm text-ink-soft px-6 py-6">No admin actions recorded yet.</p>
          ) : (
            auditLog.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 px-4 sm:px-6 py-3 border-b border-rule last:border-b-0 text-sm">
                <span className="min-w-0 break-words">{a.action.replace(/_/g, " ")}{a.detail ? ` — ${a.detail}` : ""}</span>
                <span className="text-xs text-ink-soft font-mono shrink-0 ml-3">{formatDateTime(a.created_at)}</span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
