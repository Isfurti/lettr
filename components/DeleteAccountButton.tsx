"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function DeleteAccountButton() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function remove() {
    setError(null);
    setLoading(true);
    const res = await fetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confirm: confirmText }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setLoading(false);
      setError(body.error ?? "Couldn't delete your account. Please contact support.");
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="inline-flex items-center min-h-11 text-sm font-bold text-red-600 hover:underline">
        Delete my account
      </button>
    );
  }

  return (
    <div className="border border-red-200 bg-red-50/60 rounded-2xl p-5 max-w-md">
      <p className="text-sm font-medium text-red-700 mb-1">Delete your account permanently?</p>
      <p className="text-sm text-slate mb-3">
        This deletes your account, all your resumes and your history. It can&apos;t be undone. Type{" "}
        <strong>DELETE</strong> to confirm.
      </p>
      <input
        value={confirmText}
        onChange={(e) => setConfirmText(e.target.value)}
        aria-label="Type DELETE to confirm"
        className="field-input mb-3"
      />
      {error && <p className="text-xs text-red-700 mb-3">{error}</p>}
      <div className="flex items-center gap-3">
        <button
          onClick={remove}
          disabled={confirmText !== "DELETE" || loading}
          className="inline-flex items-center min-h-11 px-5 rounded-full bg-red-600 text-white text-sm font-bold disabled:opacity-40"
        >
          {loading ? "Deleting…" : "Delete account"}
        </button>
        <button onClick={() => { setOpen(false); setConfirmText(""); setError(null); }} className="inline-flex items-center min-h-11 px-2 text-sm font-bold text-slate hover:text-ink">
          Cancel
        </button>
      </div>
    </div>
  );
}
