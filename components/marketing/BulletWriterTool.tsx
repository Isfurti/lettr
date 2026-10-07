"use client";

import { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

/** The free bullet-point writer on /tools/bullet-writer. */
export function BulletWriterTool() {
  const { status } = useSession();
  const signedIn = status === "authenticated";
  const [role, setRole] = useState("");
  const [text, setText] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; signup?: boolean; upgrade?: boolean } | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  async function rewrite() {
    if (text.trim().length < 3) {
      setError({ text: "Write what you did first, even roughly." });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = signedIn
        ? await fetch("/api/ai/generate-bullets", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ roughBullet: text, role: role || "professional" }),
          })
        : await fetch("/api/ai/guest-rewrite", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "bullet", text, role: role || undefined }),
          });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ text: body.error ?? "Couldn't rewrite that right now.", signup: body.signup, upgrade: body.upgradeRequired });
        return;
      }
      setOptions(body.options ?? []);
    } catch {
      setError({ text: "Couldn't reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-5 sm:p-7">
      <div className="grid gap-3">
        <label className="block">
          <span className="text-sm font-bold text-slate">Your job title</span>
          <input value={role} onChange={(e) => setRole(e.target.value)} className="field-input mt-1" placeholder="Sales Executive" />
        </label>
        <label className="block">
          <span className="text-sm font-bold text-slate">What you did, in your own words</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="field-input mt-1"
            placeholder="handled big clients, increased sales a lot last year"
          />
        </label>
      </div>
      <button type="button" onClick={rewrite} disabled={busy} className="btn-press mt-4 inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_4px_0_var(--brand-blue-deep)] disabled:opacity-60">
        {busy ? "Writing…" : "✦ Write my bullet"}
      </button>
      {!signedIn && <p className="text-xs text-slate mt-2">One free rewrite a day without an account. A free account gets 5 more.</p>}
      {error && (
        <p className="text-sm text-red-700 mt-3">
          {error.text}{" "}
          {error.signup && (
            <Link href="/signup" className="font-bold underline">
              Create a free account
            </Link>
          )}
          {error.upgrade && (
            <Link href="/pricing" className="font-bold underline">
              See Pro
            </Link>
          )}
        </p>
      )}
      {options.length > 0 && (
        <div className="mt-5 space-y-2" aria-live="polite">
          <p className="font-bold">Pick the one that sounds like you:</p>
          {options.map((o, i) => (
            <div key={i} className="flex items-start gap-3 bg-gold-soft rounded-2xl px-4 py-3">
              <p className="flex-1">{o}</p>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(o);
                  setCopied(i);
                  setTimeout(() => setCopied(null), 1500);
                }}
                className="shrink-0 min-h-9 px-3 rounded-full bg-white text-sm font-bold"
              >
                {copied === i ? "Copied" : "Copy"}
              </button>
            </div>
          ))}
          <p className="text-sm text-slate pt-1">
            Replace any number you don&apos;t actually know. Then{" "}
            <Link href="/builder/new" className="font-bold text-brand-blue underline">
              put it in a full resume
            </Link>
            .
          </p>
        </div>
      )}
    </div>
  );
}
