import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { listSupportMessages } from "@/lib/db";
import { ResolveButton } from "@/components/ResolveButton";

export default async function AdminSupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
  if (!adminEmail || session.user.email?.toLowerCase() !== adminEmail) notFound();

  const messages = await listSupportMessages();
  const open = messages.filter((m) => m.status === "open");
  const resolved = messages.filter((m) => m.status === "resolved");

  return (
    <main className="flex-1 max-w-3xl mx-auto w-full px-8 py-12">
      <p className="text-xs uppercase tracking-[0.18em] text-seal font-mono mb-1">Admin</p>
      <h1 className="font-display font-bold text-2xl mb-8">Support inbox</h1>

      <h2 className="font-display font-bold text-sm uppercase tracking-wide text-ink-soft mb-3">
        Open ({open.length})
      </h2>
      <div className="space-y-3 mb-10">
        {open.length === 0 && <p className="text-sm text-ink-soft">Nothing open. 🎉</p>}
        {open.map((m) => (
          <div key={m.id} className="paper-sheet rounded-sm p-4">
            <div className="flex items-center justify-between mb-1">
              <p className="font-medium text-sm">{m.subject}</p>
              <span className="text-xs text-ink-soft font-mono">{new Date(m.created_at).toLocaleString()}</span>
            </div>
            <p className="text-xs text-ink-soft mb-2">{m.email}</p>
            <p className="text-sm whitespace-pre-wrap mb-3">{m.message}</p>
            <ResolveButton id={m.id} />
          </div>
        ))}
      </div>

      {resolved.length > 0 && (
        <>
          <h2 className="font-display font-bold text-sm uppercase tracking-wide text-ink-soft mb-3">
            Resolved ({resolved.length})
          </h2>
          <div className="space-y-2 opacity-60">
            {resolved.map((m) => (
              <div key={m.id} className="paper-sheet rounded-sm p-3">
                <p className="text-sm">{m.subject} — {m.email}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
