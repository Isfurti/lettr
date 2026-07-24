"use client";

import { useState } from "react";
import Link from "next/link";

const FEATURES: { label: string; free: string | boolean; pro: string | boolean }[] = [
  { label: "Resumes", free: "1", pro: "Unlimited" },
  { label: "PDF downloads", free: "3", pro: "Unlimited" },
  { label: "AI bullet rewriting", free: true, pro: true },
  { label: "Job match / keyword targeting", free: true, pro: true },
  { label: "AI cover letter builder", free: false, pro: true },
  { label: "AI resignation letter builder", free: false, pro: true },
];

export default function PricingPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upgrade() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST" });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Couldn't start checkout.");
        setLoading(false);
        return;
      }
      window.location.href = body.url;
    } catch {
      setError("Couldn't reach the server.");
      setLoading(false);
    }
  }

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-16">
      <div className="text-center mb-12">
        <p className="uppercase tracking-[0.18em] text-xs text-seal font-mono mb-3">Pricing</p>
        <h1 className="font-display font-bold text-3xl mb-3">Simple, honest pricing</h1>
        <p className="text-ink-soft">Start free. Upgrade when you need more.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-12">
        <div className="paper-sheet rounded-sm p-8">
          <h2 className="font-display font-bold text-xl mb-1">Free</h2>
          <p className="text-3xl font-bold mb-1">$0</p>
          <p className="text-sm text-ink-soft mb-6">Get a feel for how it works.</p>
          <Link
            href="/signup"
            className="block text-center border border-rule rounded-sm py-2.5 hover:bg-rule/10 transition-colors"
          >
            Get started
          </Link>
        </div>

        <div className="paper-sheet rounded-sm p-8 border-2 border-seal relative">
          <span className="absolute -top-3 left-8 bg-seal text-white text-xs px-2 py-1 rounded-sm font-mono">
            RECOMMENDED
          </span>
          <h2 className="font-display font-bold text-xl mb-1">Pro</h2>
          <p className="text-3xl font-bold mb-1">
            $29 <span className="text-sm font-normal text-ink-soft">/ month</span>
          </p>
          <p className="text-sm text-ink-soft mb-6">Unlimited everything, all AI features.</p>
          <button
            onClick={upgrade}
            disabled={loading}
            className="w-full bg-seal text-white rounded-sm py-2.5 hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {loading ? "Redirecting…" : "Upgrade to Pro"}
          </button>
          {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
        </div>
      </div>

      <div className="paper-sheet rounded-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-rule">
              <th className="text-left p-4 font-display">Feature</th>
              <th className="text-center p-4 font-display">Free</th>
              <th className="text-center p-4 font-display text-seal">Pro</th>
            </tr>
          </thead>
          <tbody>
            {FEATURES.map((f, i) => (
              <tr key={f.label} className={i % 2 === 0 ? "" : "bg-rule/5"}>
                <td className="p-4">{f.label}</td>
                <td className="p-4 text-center">
                  {typeof f.free === "boolean" ? (f.free ? "✓" : "—") : f.free}
                </td>
                <td className="p-4 text-center text-seal font-medium">
                  {typeof f.pro === "boolean" ? (f.pro ? "✓" : "—") : f.pro}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
