"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EMPTY_SECTIONS, HEADLINE_MAX, ABOUT_MAX, INPUT_CAPS, LINKEDIN_TIPS, scoreProfile, type LinkedInSections } from "@/lib/linkedin";
import { MARKET_IDS } from "@/lib/market";

const BTN = "inline-flex items-center justify-center min-h-11 px-4 rounded-full text-sm font-bold disabled:opacity-60";
const FIELD = "mt-1 w-full rounded-xl border border-rule bg-white p-3 text-sm text-ink";

type Result = {
  headlines: string[];
  about: string[];
  experience: { before: string; options: string[] }[];
  keywordsYouShow: string[];
  keywordsAddIfTrue: string[];
};

/** A copy button that says what it copied, for screen readers too. */
function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copy ${label}`}
      className={`${BTN} border-2 border-rule bg-white text-brand-blue hover:border-ink`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {}
      }}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

/** One editable option with its character count and a copy button. */
function Option({ initial, label, max }: { initial: string; label: string; max?: number }) {
  const [text, setText] = useState(initial);
  const over = max !== undefined && text.length > max;
  return (
    <div className="rounded-xl border border-rule bg-white p-3">
      <label className="block">
        <span className="sr-only">{label}</span>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={Math.min(14, Math.max(2, Math.ceil(text.length / 70)))} className="w-full rounded-lg border border-rule bg-cream p-2 text-sm text-ink" />
      </label>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <span className={`text-xs ${over ? "text-red-700 font-bold" : "text-slate"}`}>{text.length}{max ? ` / ${max}` : ""} characters{over ? " (too long for LinkedIn)" : ""}</span>
        <CopyButton text={text} label={label} />
      </div>
    </div>
  );
}

export function LinkedInOptimizer({
  resumes,
  defaultRole,
  defaultMarket,
  allowance,
}: {
  resumes: { id: string; title: string; sections: LinkedInSections }[];
  defaultRole: string;
  defaultMarket: string;
  allowance: { used: number; limit: number | null; tier: string };
}) {
  const [role, setRole] = useState(defaultRole);
  const [market, setMarket] = useState(defaultMarket);
  const [s, setS] = useState<LinkedInSections>(EMPTY_SECTIONS);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; upgrade: boolean } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [used, setUsed] = useState(0);

  const score = useMemo(() => scoreProfile(s, role), [s, role]);
  const left = allowance.limit === null ? null : Math.max(0, allowance.limit - allowance.used - used);
  const set = (k: keyof LinkedInSections) => (e: React.ChangeEvent<HTMLTextAreaElement>) => setS((p) => ({ ...p, [k]: e.target.value }));
  const hasText = (s.headline + s.about + s.experience).trim().length >= 40;

  async function uploadPdf(file: File) {
    setNote(null);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/linkedin/parse", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError({ text: json.error ?? "Couldn't read that file.", upgrade: false });
      setS(json.sections);
      setNote("Filled from your PDF. Check each box, since the sections are split automatically. The file was not saved.");
    } catch {
      setError({ text: "Couldn't reach Lettr. Try again.", upgrade: false });
    }
  }

  async function run() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/ai/linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections: s, targetRole: role.trim(), market }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError({ text: json.error ?? "Something went wrong. Try again.", upgrade: !!json.upgradeRequired });
      setResult(json);
      setUsed((u) => u + 1);
    } catch {
      setError({ text: "Couldn't reach Lettr. Check your connection and try again.", upgrade: false });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-8">
      <section aria-labelledby="li-in" className="space-y-4">
        <h2 id="li-in" className="font-brand font-extrabold text-2xl">1. Your profile text</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-bold">Target role</span>
            <input value={role} onChange={(e) => setRole(e.target.value.slice(0, INPUT_CAPS.targetRole))} placeholder="For example: Data analyst" className="mt-1 w-full rounded-xl border border-rule bg-white px-3 min-h-11 text-sm" />
          </label>
          <label className="block">
            <span className="text-sm font-bold">Country</span>
            <select value={market} onChange={(e) => setMarket(e.target.value)} className="mt-1 w-full rounded-xl border border-rule bg-white px-3 min-h-11 text-sm">
              {MARKET_IDS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {resumes.length > 0 && (
            <label className="flex items-center gap-2 text-sm">
              <span className="font-bold">Start from a Lettr resume</span>
              <select
                defaultValue=""
                onChange={(e) => {
                  const r = resumes.find((x) => x.id === e.target.value);
                  if (r) {
                    setS((p) => ({ ...r.sections, headline: p.headline }));
                    setNote("Filled from your resume. Add your current headline if you want it checked.");
                  }
                }}
                className="rounded-xl border border-rule bg-white px-3 min-h-11"
              >
                <option value="" disabled>Choose a resume</option>
                {resumes.map((r) => <option key={r.id} value={r.id}>{r.title}</option>)}
              </select>
            </label>
          )}
          <label className={`${BTN} border-2 border-rule bg-white text-brand-blue hover:border-ink cursor-pointer`}>
            Upload LinkedIn PDF
            <input type="file" accept="application/pdf,.pdf" className="sr-only" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPdf(f); e.target.value = ""; }} />
          </label>
        </div>
        <p className="text-xs text-slate">On LinkedIn: open your profile, choose More, then Save to PDF. Your pasted text and your file are used for this request only and are not saved.</p>
        {note && <p role="status" className="text-sm font-bold">{note}</p>}

        <label className="block"><span className="text-sm font-bold">Headline</span>
          <textarea value={s.headline} onChange={set("headline")} rows={2} maxLength={INPUT_CAPS.headline} className={FIELD} />
        </label>
        <label className="block"><span className="text-sm font-bold">About</span>
          <textarea value={s.about} onChange={set("about")} rows={6} maxLength={INPUT_CAPS.about} className={FIELD} />
        </label>
        <label className="block"><span className="text-sm font-bold">Experience (one point per line)</span>
          <textarea value={s.experience} onChange={set("experience")} rows={8} maxLength={INPUT_CAPS.experience} className={FIELD} />
        </label>
        <label className="block"><span className="text-sm font-bold">Skills (separated by commas)</span>
          <textarea value={s.skills} onChange={set("skills")} rows={3} maxLength={INPUT_CAPS.skills} className={FIELD} />
        </label>
      </section>

      <section aria-labelledby="li-score" className="space-y-3">
        <h2 id="li-score" className="font-brand font-extrabold text-2xl">2. Your profile score: {score.score} / 100</h2>
        <p className="text-sm text-slate">A guide to spot gaps, not a promise. It updates as you type and is free.</p>
        <ul className="space-y-2">
          {score.reasons.map((r, n) => (
            <li key={n} className="flex gap-2 text-sm">
              <span aria-hidden="true" className="font-bold">{r.ok ? "✓" : "•"}</span>
              <span><span className="sr-only">{r.ok ? "Good: " : "To improve: "}</span>{r.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="li-ai" className="space-y-3">
        <h2 id="li-ai" className="font-brand font-extrabold text-2xl">3. Rewrite it</h2>
        <p className="text-sm text-slate">Lettr rewrites using only what you wrote above. Nothing is posted to LinkedIn: you copy what you like.</p>
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={run} disabled={busy || !hasText || role.trim().length < 2 || left === 0} className={`${BTN} bg-ink text-white`}>
            {busy ? "Writing..." : "Rewrite my profile"}
          </button>
          {left !== null && <span className="text-sm text-slate">{left === 0 ? "No tries left" : `${left} ${allowance.tier === "free" ? "free try left" : "left this month"}`}</span>}
          {role.trim().length < 2 && <span className="text-sm text-slate">Add a target role.</span>}
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-700">{error.text} {error.upgrade && <Link href="/pricing" className="underline text-brand-blue">See Pro</Link>}</p>
        )}
      </section>

      {result && (
        <div className="space-y-8" aria-live="polite">
          <section aria-labelledby="li-h" className="space-y-3">
            <h3 id="li-h" className="font-brand font-extrabold text-xl">Headline options</h3>
            {result.headlines.length ? result.headlines.map((h, n) => <Option key={n} initial={h} label={`headline option ${n + 1}`} max={HEADLINE_MAX} />) : <p className="text-sm text-slate">No safe headline this time. Add more detail about your skills and try again.</p>}
          </section>
          <section aria-labelledby="li-a" className="space-y-3">
            <h3 id="li-a" className="font-brand font-extrabold text-xl">About options</h3>
            {result.about.length ? result.about.map((a, n) => <Option key={n} initial={a} label={`About option ${n + 1}`} max={ABOUT_MAX} />) : <p className="text-sm text-slate">No safe About this time. Add more detail and try again.</p>}
          </section>
          <section aria-labelledby="li-e" className="space-y-3">
            <h3 id="li-e" className="font-brand font-extrabold text-xl">Experience points</h3>
            {result.experience.length ? result.experience.map((e, n) => (
              <div key={n} className="space-y-2">
                <p className="text-sm text-slate break-words"><span className="font-bold">Before: </span>{e.before}</p>
                {e.options.map((o, k) => <Option key={k} initial={o} label={`experience point ${n + 1} option ${k + 1}`} />)}
              </div>
            )) : <p className="text-sm text-slate">No experience points could be rewritten without adding something you did not write.</p>}
          </section>
          <section aria-labelledby="li-k" className="space-y-3">
            <h3 id="li-k" className="font-brand font-extrabold text-xl">Skills and keywords for {role.trim()}</h3>
            {result.keywordsYouShow.length > 0 && <p className="text-sm"><span className="font-bold">You already show: </span>{result.keywordsYouShow.join(", ")}</p>}
            {result.keywordsAddIfTrue.length > 0 && <p className="text-sm"><span className="font-bold">Add only if true for you: </span>{result.keywordsAddIfTrue.join(", ")}</p>}
          </section>
        </div>
      )}

      <section aria-labelledby="li-tips" className="space-y-3">
        <h2 id="li-tips" className="font-brand font-extrabold text-2xl">Tips you do on LinkedIn</h2>
        <ul className="list-disc pl-5 space-y-2 text-sm">{LINKEDIN_TIPS.map((t) => <li key={t}>{t}</li>)}</ul>
      </section>
    </div>
  );
}
