"use client";

import { useState } from "react";

/** Account setting: let Lettr learn from anonymised AI suggestions you keep or edit. Off by default. */
export function AiConsentToggle({ initial }: { initial: boolean }) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  async function toggle(next: boolean) {
    setBusy(true);
    setNote(null);
    const res = await fetch("/api/account/ai-consent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: next }),
    }).catch(() => null);
    setBusy(false);
    if (res?.ok) {
      setOn(next);
      setNote(next ? "Thank you. You can turn this off any time." : "Turned off. Examples saved from you have been deleted.");
    } else setNote("Couldn't save. Try again.");
  }

  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="font-bold">Help improve Lettr&apos;s AI</p>
        <p className="text-sm text-slate mt-1 max-w-xl">
          When on, Lettr keeps anonymised examples of AI suggestions you keep or edit (with your name, employers, emails and phone numbers
          removed) to make future suggestions better. Off by default. Turning it off deletes what was kept.
        </p>
        {note && (
          <p className="text-sm font-bold mt-1" aria-live="polite">
            {note}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Help improve Lettr's AI"
        disabled={busy}
        onClick={() => toggle(!on)}
        className={`relative shrink-0 w-14 h-8 rounded-full transition-colors disabled:opacity-60 ${on ? "bg-brand-blue" : "bg-rule"}`}
      >
        <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-all ${on ? "left-7" : "left-1"}`} />
      </button>
    </div>
  );
}
