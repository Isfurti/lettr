import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "@/components/AdminSidebar";
import pool, { listAdminAuditLog } from "@/lib/db";

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

  const integrations = [
    { name: "Anthropic (AI features)", configured: Boolean(process.env.ANTHROPIC_API_KEY) },
    { name: "Stripe (billing)", configured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PRO_PRICE_ID) },
    { name: "Google (Sign in + Drive export)", configured: Boolean(process.env.GOOGLE_CLIENT_ID) },
    { name: "LinkedIn (Sign in)", configured: Boolean(process.env.LINKEDIN_CLIENT_ID) },
    { name: "Sentry (error tracking)", configured: Boolean(process.env.SENTRY_DSN) },
    { name: "Resend (support email alerts)", configured: Boolean(process.env.RESEND_API_KEY) },
  ];

  return (
    <div className="flex-1 flex app-shell">
      <AdminSidebar />
      <main className="flex-1 px-10 py-10 max-w-3xl">
        <h1 className="font-display font-semibold text-3xl mb-1">System</h1>
        <p className="text-ink-soft mb-8">Live configuration status — nothing here is cached or estimated.</p>

        <div className="paper-sheet rounded-sm p-6 mb-6 flex items-center justify-between">
          <div>
            <p className="font-medium">Database</p>
            <p className="text-xs text-ink-soft">{db.ok ? "Connected" : db.error}</p>
          </div>
          <span className={`text-xs font-mono uppercase px-2.5 py-1 rounded-sm ${db.ok ? "bg-seal-soft text-seal-deep" : "bg-red-50 text-red-700"}`}>
            {db.ok ? "Operational" : "Error"}
          </span>
        </div>

        <div className="paper-sheet rounded-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-rule">
            <p className="text-xs uppercase tracking-wide text-ink-soft font-medium">Integrations</p>
          </div>
          {integrations.map((i) => (
            <div key={i.name} className="flex items-center justify-between px-6 py-3 border-b border-rule last:border-b-0">
              <p className="text-sm">{i.name}</p>
              <span className={`text-xs font-mono uppercase px-2 py-0.5 rounded-sm ${i.configured ? "bg-seal-soft text-seal-deep" : "bg-rule/40 text-ink-soft"}`}>
                {i.configured ? "Configured" : "Not set"}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-soft mt-4 mb-8">
          &quot;Configured&quot; only checks that the environment variable is present — it doesn&apos;t verify the
          credential is valid. Check{" "}
          <a href="/api/health" target="_blank" rel="noreferrer" className="text-seal hover:underline">
            /api/health
          </a>{" "}
          directly for the raw JSON, or an uptime monitor for continuous checks.
        </p>

        <div className="paper-sheet rounded-sm overflow-hidden">
          <div className="px-6 py-3 border-b border-rule">
            <p className="text-xs uppercase tracking-wide text-ink-soft font-medium">Admin audit log</p>
            <p className="text-xs text-ink-soft mt-0.5">Every admin action that touched a user's data.</p>
          </div>
          {auditLog.length === 0 ? (
            <p className="text-sm text-ink-soft px-6 py-6">No admin actions recorded yet.</p>
          ) : (
            auditLog.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-6 py-3 border-b border-rule last:border-b-0 text-sm">
                <span>{a.action.replace(/_/g, " ")}{a.detail ? ` — ${a.detail}` : ""}</span>
                <span className="text-xs text-ink-soft font-mono shrink-0 ml-3">{new Date(a.created_at).toLocaleString()}</span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
