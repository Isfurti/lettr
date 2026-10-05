"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ResumeData } from "@/lib/types";
import { saveGuestDraft, loadGuestDraft, guestDraftHasContent } from "@/lib/guest-draft";

/** Opens an example in the builder: as a local draft for visitors, or as a new saved resume when signed in. */
export function UseExampleButton({ data, template, label = "Use this example" }: { data: ResumeData; template: string; label?: string }) {
  const router = useRouter();
  const { status } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmReplace, setConfirmReplace] = useState(false);

  async function create(tpl: string) {
    return fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `${data.contact.fullName}'s Resume (example)`, template: tpl, data }),
    });
  }

  async function use() {
    setError(null);
    if (status !== "authenticated") {
      if (!confirmReplace && guestDraftHasContent(loadGuestDraft())) {
        setConfirmReplace(true);
        return;
      }
      saveGuestDraft({ data, template });
      router.push("/builder/new");
      return;
    }
    setBusy(true);
    let res = await create(template);
    // Free plans can't save Pro templates: fall back to Classic rather than blocking.
    if (res.status === 402 && template !== "classic") res = await create("classic");
    setBusy(false);
    if (res.status === 402) {
      setError("Your free plan already has a resume. Upgrade to Pro for more, or edit your existing one.");
      return;
    }
    if (!res.ok) {
      setError("Couldn't open this example. Please try again.");
      return;
    }
    const body = await res.json();
    router.push(`/builder/${body.id}`);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={use}
        disabled={busy}
        className="btn-press inline-flex items-center justify-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
      >
        {busy ? "Opening…" : confirmReplace ? "Yes, replace my draft" : label}
      </button>
      {confirmReplace && (
        <p className="text-sm text-slate">
          You already have a draft on this device. Using this example replaces it.{" "}
          <button onClick={() => setConfirmReplace(false)} className="inline-flex items-center min-h-10 font-bold text-brand-blue hover:underline">
            Keep my draft
          </button>
        </p>
      )}
      {error && (
        <p className="text-sm font-bold text-red-700">
          {error}{" "}
          <Link href="/pricing" className="underline">
            See Pro
          </Link>
        </p>
      )}
    </div>
  );
}
