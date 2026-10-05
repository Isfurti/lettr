"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UseTemplateButton({
  template,
  label = "Use this template",
  isLoggedIn = false,
  locked = false,
}: {
  template: string;
  label?: string;
  isLoggedIn?: boolean;
  /** True when we already know client-side this user's plan can't use this
   * template - skips the round-trip and goes straight to the upgrade path. */
  locked?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function use() {
    if (locked) {
      router.push("/pricing");
      return;
    }

    // Not logged in - skip the API entirely and drop them straight into the
    // guest builder. No account, no 401 round trip, just start building.
    // (Guests can freely explore any template while building - the
    // restriction is enforced server-side once they actually save/export
    // after signing up, same as everywhere else.)
    if (!isLoggedIn) {
      router.push(`/builder/new?template=${template}`);
      return;
    }

    setLoading(true);
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled Resume", template }),
    });
    setLoading(false);

    if (res.status === 402) {
      router.push("/pricing");
      return;
    }
    if (res.ok) {
      const body = await res.json();
      router.push(`/builder/${body.id}`);
    }
  }

  return (
    <button
      onClick={use}
      disabled={loading}
      className={`btn-press w-full min-h-11 rounded-full text-[15px] font-bold disabled:opacity-60 ${
        locked
          ? "bg-gold text-ink shadow-[0_4px_0_var(--gold-deep)]"
          : "bg-brand-blue text-white shadow-[0_4px_0_var(--brand-blue-deep)]"
      }`}
    >
      {loading ? "Creating…" : locked ? "Upgrade to use" : label}
    </button>
  );
}
