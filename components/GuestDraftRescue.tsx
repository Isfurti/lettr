"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { loadGuestDraft, clearGuestDraft, guestDraftHasContent, completeGuestExport } from "@/lib/guest-draft";

/**
 * Catches work started as a guest that didn't get carried over on sign-in
 * (e.g. signed in with Google/LinkedIn, or opened the dashboard directly),
 * so nobody silently loses a resume they already typed out.
 */
export function GuestDraftRescue() {
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const draft = loadGuestDraft();
    if (guestDraftHasContent(draft)) {
      // localStorage only exists in the browser, so this has to run after mount.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setName(draft.data.contact.fullName || "");
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  async function save() {
    setSaving(true);
    setError(null);
    const ok = await completeGuestExport((path) => router.push(path));
    setSaving(false);
    if (!ok) setError("Couldn't save it - your plan may be at its resume limit. Delete a resume or upgrade, then try again.");
  }

  return (
    <div className="mb-6 paper-sheet rounded-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-l-4 border-seal">
      <div>
        <p className="text-sm font-medium">You have an unsaved draft from before you signed in{name ? ` (${name})` : ""}.</p>
        <p className="text-xs text-ink-soft">Save it to your account so you don&apos;t lose it.</p>
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="bg-seal text-white text-sm px-4 py-2 rounded-sm hover:opacity-90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save draft to my account"}
        </button>
        <button
          onClick={() => {
            clearGuestDraft();
            setVisible(false);
          }}
          className="text-sm text-ink-soft hover:text-ink"
        >
          Discard
        </button>
      </div>
    </div>
  );
}
