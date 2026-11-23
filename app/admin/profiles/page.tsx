import Link from "next/link";
import type { Metadata } from "next";
import { requireAdmin } from "@/lib/admin-auth";
import { listProfileReports, listTakenDownProfiles } from "@/lib/db";
import { AdminSidebar } from "@/components/AdminSidebar";
import { AdminProfileActions } from "@/components/AdminProfileActions";
import { formatDateTime } from "@/lib/format-date";

export const metadata: Metadata = { title: "Profile reports | Lettr Admin" };

const REASON: Record<string, string> = {
  not_me: "About me, I did not make it",
  private_info: "Shows private information",
  harassment: "Harassment or abuse",
  spam: "Spam or a scam",
  other: "Something else",
};

export default async function AdminProfilesPage() {
  await requireAdmin();
  const [reports, takenDown] = await Promise.all([listProfileReports(), listTakenDownProfiles()]);
  const open = reports.filter((r) => r.status === "open");
  const done = reports.filter((r) => r.status !== "open");

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-4xl">
        <h1 className="font-brand font-extrabold text-[36px] tracking-tight mb-1">Profile reports</h1>
        <p className="text-ink-soft text-sm mb-8">Reports about shared profiles. Taking a profile down hides it at once and stops the owner sharing it again. A restored profile stays private until the owner shares it again.</p>

        <h2 className="font-brand font-extrabold text-sm uppercase tracking-wide text-ink-soft mb-3">Open ({open.length})</h2>
        <div className="space-y-3 mb-10">
          {open.length === 0 && <p className="text-sm text-ink-soft">Nothing open.</p>}
          {open.map((r) => (
            <div key={r.id} className="bg-white border border-rule rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <p className="font-medium text-sm">{REASON[r.reason] ?? r.reason}</p>
                <span className="text-xs text-ink-soft font-mono">{formatDateTime(r.created_at)}</span>
              </div>
              <p className="text-xs text-ink-soft mb-2 break-all">
                Profile of{" "}
                <Link href={`/admin/users/${r.profile_user_id}`} className="underline">{r.user_name || r.user_email || r.profile_user_id}</Link>
                {r.disabled_at ? " (taken down)" : r.shared ? " (shared)" : " (not shared now)"}
                {r.reporter_email ? ` · reporter: ${r.reporter_email}` : " · reporter gave no email"}
              </p>
              {r.details && <p className="text-sm whitespace-pre-wrap mb-3">{r.details}</p>}
              <AdminProfileActions userId={r.profile_user_id} reportId={r.id} disabled={Boolean(r.disabled_at)} />
            </div>
          ))}
        </div>

        <h2 className="font-brand font-extrabold text-sm uppercase tracking-wide text-ink-soft mb-3">Taken down ({takenDown.length})</h2>
        <div className="space-y-3 mb-10">
          {takenDown.length === 0 && <p className="text-sm text-ink-soft">No profiles are taken down.</p>}
          {takenDown.map((t) => (
            <div key={t.user_id} className="bg-white border border-rule rounded-xl p-4">
              <p className="text-sm font-medium break-all">
                <Link href={`/admin/users/${t.user_id}`} className="underline">{t.name || t.email || t.user_id}</Link>
                <span className="text-xs text-ink-soft font-mono ml-2">{formatDateTime(t.disabled_at)}</span>
              </p>
              {t.disabled_reason && <p className="text-sm text-ink-soft mb-3 whitespace-pre-wrap">{t.disabled_reason}</p>}
              <AdminProfileActions userId={t.user_id} disabled />
            </div>
          ))}
        </div>

        <h2 className="font-brand font-extrabold text-sm uppercase tracking-wide text-ink-soft mb-3">Handled ({done.length})</h2>
        <div className="space-y-2">
          {done.map((r) => (
            <p key={r.id} className="text-sm text-ink-soft">
              {formatDateTime(r.created_at)} · {REASON[r.reason] ?? r.reason} · {r.user_email ?? "deleted user"} · {r.status}
            </p>
          ))}
        </div>
      </main>
    </div>
  );
}
