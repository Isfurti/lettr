"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function UseTemplateButton({
  template,
  label = "Use this template",
  locked = false,
}: {
  template: string;
  label?: string;
  /** Kept for older call sites; signed-in or not, /builder/new does the right thing. */
  isLoggedIn?: boolean;
  /** True when we already know client-side this user's plan can't use this
   * template - skips the round-trip and goes straight to the upgrade path. */
  locked?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  function use() {
    if (locked) {
      router.push("/pricing");
      return;
    }
    // /builder/new handles everyone: guests start a draft in this template;
    // signed-in people get a new resume in it, or, when their plan's resume
    // limit is reached, their existing resume opens switched to it.
    setLoading(true);
    router.push(`/builder/new?template=${encodeURIComponent(template)}`);
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
      {loading ? "Opening…" : locked ? "Upgrade to use" : label}
    </button>
  );
}
