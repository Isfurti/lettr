"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Admin: check and send the AI's reply to a low-rated review. */
export function HeldReplyEditor({ reviewId, draft }: { reviewId: string; draft: string }) {
  const router = useRouter();
  const [reply, setReply] = useState(draft);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function send() {
    setBusy(true);
    setNote(null);
    const res = await fetch(`/api/admin/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    }).catch(() => null);
    setBusy(false);
    const body = await res?.json().catch(() => ({}));
    if (!res?.ok) {
      setNote(body?.error ?? "Couldn't send.");
      return;
    }
    setNote(body.emailed ? "Sent." : "Approved. Email isn't set up yet, so it shows on their Feedback page only.");
    router.refresh();
  }

  return (
    <div className="mt-2 mb-3 bg-gold-soft rounded-xl p-3">
      <p className="text-xs font-bold mb-1.5">Reply waiting for your approval (low rating). Edit if needed, then send:</p>
      <textarea value={reply} onChange={(e) => setReply(e.target.value)} rows={4} className="field-input text-sm" aria-label="Reply" />
      <div className="flex items-center gap-3 mt-2">
        <button type="button" onClick={send} disabled={busy} className="min-h-10 px-4 rounded-full bg-ink text-white text-sm font-bold disabled:opacity-60">
          {busy ? "Sending…" : "Approve and send"}
        </button>
        {note && <span className="text-xs font-bold">{note}</span>}
      </div>
    </div>
  );
}
