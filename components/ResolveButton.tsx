"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Marks a support message resolved - or reopens it when `reopen` is set. */
export function ResolveButton({ id, reopen = false }: { id: string; reopen?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function update() {
    setLoading(true);
    setError(false);
    const res = await fetch("/api/support/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: reopen ? "open" : "resolved" }),
    }).catch(() => null);
    setLoading(false);
    if (!res?.ok) {
      setError(true);
      return;
    }
    router.refresh();
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={update} disabled={loading} className="text-xs text-seal hover:underline disabled:opacity-60">
        {loading ? "Saving…" : reopen ? "Reopen" : "Mark resolved"}
      </button>
      {error && <span className="text-xs text-red-600">Didn&apos;t save — try again</span>}
    </span>
  );
}
