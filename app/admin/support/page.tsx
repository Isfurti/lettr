import { requireAdmin } from "@/lib/admin-auth";
import { listSupportMessages } from "@/lib/db";
import { ResolveButton } from "@/components/ResolveButton";
import { formatDateTime } from "@/lib/format-date";
import { EMAIL_SIGN_OFF } from "@/lib/tagline";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support inbox | Lettr Admin" };

/** Opens the admin's email app with a reply already addressed and quoted. */
function replyHref(m: { email: string; subject: string; message: string }) {
  const quoted = m.message.split("\n").map((l) => `> ${l}`).join("\n");
  const body = `Hi,\n\nThanks for getting in touch.\n\n\n\n${EMAIL_SIGN_OFF}\n\n${quoted}`;
  return `mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}&body=${encodeURIComponent(body)}`;
}
import { AdminSidebar } from "@/components/AdminSidebar";

export default async function AdminSupportPage() {
  await requireAdmin();

  const messages = await listSupportMessages();
  const open = messages.filter((m) => m.status === "open");
  const resolved = messages.filter((m) => m.status === "resolved");

  return (
    <div className="flex-1 flex flex-col lg:flex-row admin-shell">
      <AdminSidebar />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 w-full max-w-4xl">
        <h1 className="font-brand font-extrabold text-[36px] tracking-tight mb-1">Support inbox</h1>
        <p className="text-ink-soft text-sm mb-8">
          Messages from the Contact page.{" "}
          {!process.env.RESEND_API_KEY && "Email alerts aren't set up (Resend), so check here regularly."}
        </p>

        <h2 className="font-brand font-extrabold text-sm uppercase tracking-wide text-ink-soft mb-3">
          Open ({open.length})
        </h2>
        <div className="space-y-3 mb-10">
          {open.length === 0 && <p className="text-sm text-ink-soft">Nothing open. 🎉</p>}
          {open.map((m) => (
            <div key={m.id} className="bg-white border border-rule rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <p className="font-medium text-sm">{m.subject}</p>
                <span className="text-xs text-ink-soft font-mono">{formatDateTime(m.created_at)}</span>
              </div>
              <p className="text-xs text-ink-soft mb-2 break-all">{m.email}</p>
              <p className="text-sm whitespace-pre-wrap mb-3">{m.message}</p>
              <div className="flex items-center gap-4">
                <a href={replyHref(m)} className="text-xs bg-ink text-white px-3 py-1.5 rounded-xl hover:opacity-90">
                  Reply by email
                </a>
                <ResolveButton id={m.id} />
              </div>
            </div>
          ))}
        </div>

        {resolved.length > 0 && (
          <>
            <h2 className="font-brand font-extrabold text-sm uppercase tracking-wide text-ink-soft mb-3">
              Resolved ({resolved.length})
            </h2>
            <div className="space-y-2">
              {resolved.map((m) => (
                <details key={m.id} className="bg-white border border-rule rounded-xl p-3 group">
                  <summary className="cursor-pointer list-none flex flex-wrap items-center justify-between gap-2 text-sm text-ink-soft">
                    <span className="min-w-0 break-words">{m.subject} — {m.email}</span>
                    <span className="text-xs font-mono">{formatDateTime(m.created_at)}</span>
                  </summary>
                  <p className="text-sm whitespace-pre-wrap mt-3 mb-3">{m.message}</p>
                  <div className="flex items-center gap-4">
                    <a href={replyHref(m)} className="text-xs text-brand-blue hover:underline">Reply by email</a>
                    <ResolveButton id={m.id} reopen />
                  </div>
                </details>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
