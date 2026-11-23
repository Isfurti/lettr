"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Take down, restore or dismiss, for one reported profile. */
export function AdminProfileActions({ userId, reportId, disabled }: { userId: string; reportId: string; disabled: boolean }) {
  const router = useRouter();
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function run(path: string, body: unknown) {
    if (busy) return;
    setBusy(true);
    setError("");
    const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).catch(() => null);
    setBusy(false);
    if (!res?.ok) {
      const data = await res?.json().catch(() => ({}));
      setError(String(data?.error ?? "That didn't work. Try again."));
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-2">
      {!disabled && (
        <div className="flex flex-wrap items-center gap-2">
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason (kept in the audit log)" aria-label="Reason for taking the profile down" maxLength={500} className="min-h-9 flex-1 basis-56 rounded-lg border border-rule px-2 text-sm" />
          <button type="button" disabled={busy || reason.trim().length < 3} onClick={() => run(`/api/admin/profiles/${userId}`, { action: "disable", reason })} className="rounded-xl bg-[#b3261e] px-3 py-1.5 text-xs text-white disabled:opacity-50">Take profile down</button>
        </div>
      )}
      {disabled && (
        <button type="button" disabled={busy} onClick={() => run(`/api/admin/profiles/${userId}`, { action: "restore" })} className="self-start rounded-xl border border-rule px-3 py-1.5 text-xs">Restore (stays private until the owner shares again)</button>
      )}
      <button type="button" disabled={busy} onClick={() => run(`/api/admin/profile-reports/${reportId}`, {})} className="self-start text-xs text-seal hover:underline disabled:opacity-60">Dismiss this report</button>
      {error && <p role="alert" className="text-xs text-[#b3261e]">{error}</p>}
    </div>
  );
}
