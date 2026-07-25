"use client";

import { useState } from "react";
import Link from "next/link";
import { Reveal } from "@/components/Reveal";

const COMPARISON: { feature: string; free: string | boolean; pro: string | boolean }[] = [
  { feature: "Resumes", free: "1", pro: "Unlimited" },
  { feature: "PDF downloads", free: "3", pro: "Unlimited" },
  { feature: "AI bullet rewriting", free: true, pro: true },
  { feature: "AI resume summary writer", free: true, pro: true },
  { feature: "AI Resume Agent (chat editing)", free: true, pro: true },
  { feature: "Resume quality score", free: true, pro: true },
  { feature: "Job match / keyword targeting", free: true, pro: true },
  { feature: "AI cover letter builder", free: false, pro: true },
  { feature: "AI resignation letter builder", free: false, pro: true },
  { feature: "DOCX export", free: false, pro: true },
  { feature: "Google Drive export", free: false, pro: true },
];

const FAQS = [
  {
    q: "Can I cancel anytime?",
    a: "Yes. Pro is billed monthly and can be cancelled anytime from your dashboard's billing portal. You keep Pro access until the end of the billing period you already paid for.",
  },
  {
    q: "How does the resume score work?",
    a: "It's a real, deterministic check of your resume's structure — contact completeness, summary quality, whether your bullets use strong action verbs and quantified results, education, and skill count. It's not a black box; you can read the exact logic in the codebase.",
  },
  {
    q: "What does the AI actually rewrite?",
    a: "Bullet points, your summary, cover letters, and resignation letters, generated fresh each time from your real experience — not filled-in templates.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes — 1 resume, 3 PDF downloads, and the core AI writing tools, no credit card required.",
  },
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
    <main className="flex-1">
      <section className="max-w-3xl mx-auto w-full px-8 pt-20 pb-16 text-center">
        <h1 className="font-display text-5xl font-bold leading-tight mb-6">
          Invest in your career&apos;s first impression.
        </h1>
        <p className="text-ink-soft text-lg max-w-xl mx-auto">
          Start free. Upgrade when the AI writing tools and unlimited exports are worth it to you.
        </p>
      </section>

      <section className="max-w-5xl mx-auto w-full px-8 pb-24">
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <Reveal className="paper-sheet rounded-sm p-10 flex flex-col">
            <p className="text-xs uppercase tracking-wide text-ink-soft mb-2">Entry level</p>
            <h2 className="font-display font-semibold text-2xl mb-6">Free</h2>
            <div className="mb-8">
              <span className="font-display text-4xl font-bold">$0</span>
              <span className="text-ink-soft"> / forever</span>
            </div>
            <ul className="space-y-3 mb-10 flex-1 text-sm">
              <FeatureLine included>1 resume</FeatureLine>
              <FeatureLine included>3 PDF downloads</FeatureLine>
              <FeatureLine included>AI bullet &amp; summary writing</FeatureLine>
              <FeatureLine included>AI Resume Agent</FeatureLine>
              <FeatureLine>Cover &amp; resignation letters</FeatureLine>
              <FeatureLine>DOCX / Google Drive export</FeatureLine>
            </ul>
            <Link
              href="/signup"
              className="w-full text-center py-3.5 border border-ink rounded-sm font-medium hover:bg-ink/5 transition-colors"
            >
              Get started
            </Link>
          </Reveal>

          <Reveal delay={100} className="bg-ink text-white rounded-sm p-10 flex flex-col relative overflow-hidden md:-mt-4 md:mb-4">
            <div className="absolute top-4 right-[-38px] bg-seal text-white text-[10px] font-semibold tracking-wide px-10 py-1 rotate-45">
              RECOMMENDED
            </div>
            <p className="text-xs uppercase tracking-wide text-white/60 mb-2">Full access</p>
            <h2 className="font-display font-semibold text-2xl mb-6">Pro</h2>
            <div className="mb-8">
              <span className="font-display text-4xl font-bold">$19</span>
              <span className="text-white/60"> / month</span>
            </div>
            <ul className="space-y-3 mb-10 flex-1 text-sm">
              <FeatureLine included dark>Unlimited resumes</FeatureLine>
              <FeatureLine included dark>Unlimited PDF downloads</FeatureLine>
              <FeatureLine included dark>Everything in Free</FeatureLine>
              <FeatureLine included dark>AI cover letter builder</FeatureLine>
              <FeatureLine included dark>AI resignation letter builder</FeatureLine>
              <FeatureLine included dark>DOCX &amp; Google Drive export</FeatureLine>
            </ul>
            <button
              onClick={upgrade}
              disabled={loading}
              className="w-full py-3.5 bg-seal rounded-sm font-medium hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? "Redirecting…" : "Upgrade to Pro"}
            </button>
            {error && <p className="text-sm text-red-300 mt-2">{error}</p>}
          </Reveal>
        </div>
      </section>

      <section className="bg-white border-y border-rule">
        <div className="max-w-4xl mx-auto w-full px-8 py-20">
          <Reveal className="text-center mb-14">
            <h2 className="font-display font-semibold text-3xl mb-2">Compare plans</h2>
            <p className="text-ink-soft">Every feature, side by side.</p>
          </Reveal>
          <Reveal>
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule text-xs uppercase tracking-wide text-ink-soft">
                  <th className="py-4 px-4 w-1/2">Feature</th>
                  <th className="py-4 px-4 text-center">Free</th>
                  <th className="py-4 px-4 text-center bg-seal-soft">Pro</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row) => (
                  <tr key={row.feature} className="border-b border-rule/60">
                    <td className="py-4 px-4 font-medium">{row.feature}</td>
                    <td className="py-4 px-4 text-center text-ink-soft">
                      {typeof row.free === "boolean" ? (row.free ? "✓" : "—") : row.free}
                    </td>
                    <td className="py-4 px-4 text-center font-semibold bg-seal-soft/50">
                      {typeof row.pro === "boolean" ? (row.pro ? "✓" : "—") : row.pro}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Reveal>
        </div>
      </section>

      <section className="max-w-4xl mx-auto w-full px-8 py-20">
        <div className="grid md:grid-cols-12 gap-10">
          <Reveal className="md:col-span-4">
            <h2 className="font-display font-semibold text-2xl mb-3">Frequently asked questions</h2>
            <p className="text-ink-soft text-sm">
              Can&apos;t find what you&apos;re looking for?{" "}
              <Link href="/support" className="text-ink underline">
                Contact support.
              </Link>
            </p>
          </Reveal>
          <div className="md:col-span-8 space-y-8">
            {FAQS.map((f, i) => (
              <Reveal key={f.q} delay={i * 80}>
                <h3 className="font-display font-semibold text-lg mb-2">{f.q}</h3>
                <p className="text-ink-soft text-sm leading-relaxed">{f.a}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 grid grid-cols-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-r border-white/20" />
          ))}
        </div>
        <div className="max-w-3xl mx-auto w-full px-8 py-24 text-center relative z-10">
          <Reveal>
            <h2 className="font-display text-4xl font-bold mb-8">Ready to write your next chapter?</h2>
            <Link
              href="/signup"
              className="inline-block bg-seal text-white px-8 py-4 rounded-sm font-medium hover:opacity-90 transition-opacity"
            >
              Create your free resume
            </Link>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

function FeatureLine({ children, included, dark }: { children: React.ReactNode; included?: boolean; dark?: boolean }) {
  return (
    <li className={`flex items-center gap-2 ${included ? "" : dark ? "text-white/40" : "text-ink-soft/60"}`}>
      <span className={included ? "text-seal" : dark ? "text-white/30" : "text-ink-soft/40"}>
        {included ? "✓" : "–"}
      </span>
      {children}
    </li>
  );
}
