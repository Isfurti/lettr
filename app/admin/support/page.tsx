import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { listSupportMessages } from "@/lib/db";
import { ResolveButton } from "@/components/ResolveButton";
import { AdminSidebar } from "@/components/AdminSidebar";

function fingerprint(value: string) {
  // Shows enough to spot whitespace/hidden-character mismatches without
  // fully exposing the value in a screenshot.
  return {
    length: value.length,
    trimmedLength: value.trim().length,
    first3: value.slice(0, 3),
    last3: value.slice(-3),
  };
}

export default async function AdminSupportPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const adminEmailRaw = process.env.ADMIN_EMAIL;
  const yourEmailRaw = session.user.email ?? "";
  const isMatch =
    !!adminEmailRaw && yourEmailRaw.trim().toLowerCase() === adminEmailRaw.trim().toLowerCase();

  if (!isMatch) {
    return (
      <main className="flex-1 max-w-lg mx-auto w-full px-8 py-12">
        <h1 className="font-display font-semibold text-xl mb-4">Admin check failed</h1>
        <p className="text-sm text-ink-soft mb-6">
          You&apos;re logged in, but your email doesn&apos;t match <code>ADMIN_EMAIL</code>. Compare
          these fingerprints against what you typed into Vercel — a mismatched length usually means
          stray whitespace or a hidden character got copied in.
        </p>
        <div className="paper-sheet rounded-sm p-4 space-y-3 font-mono text-xs">
          <div>
            <p className="text-ink-soft mb-1">Your logged-in session email:</p>
            <pre>{JSON.stringify(fingerprint(yourEmailRaw), null, 2)}</pre>
          </div>
          <div>
            <p className="text-ink-soft mb-1">ADMIN_EMAIL env var (server-side):</p>
            <pre>
              {adminEmailRaw ? JSON.stringify(fingerprint(adminEmailRaw), null, 2) : "NOT SET"}
            </pre>
          </div>
        </div>
      </main>
    );
  }

  const messages = await listSupportMessages();
  const open = messages.filter((m) => m.status === "open");
  const resolved = messages.filter((m) => m.status === "resolved");

  return (
    <div className="flex-1 flex app-shell">
      <AdminSidebar />
      <main className="flex-1 px-10 py-10 max-w-4xl">
        <h1 className="font-display font-semibold text-3xl mb-8">Support inbox</h1>

        <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-ink-soft mb-3">
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
            <h2 className="font-display font-semibold text-sm uppercase tracking-wide text-ink-soft mb-3">
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
    </div>
  );
}
