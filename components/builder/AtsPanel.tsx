"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ResumeData } from "@/lib/types";
import { analyzeAts, type AtsCheck, type CheckStatus } from "@/lib/ats-analyst";
import type { AnalystAdvice } from "@/lib/ai";
import { ScoreRing } from "@/components/ScoreRing";

const ICON: Record<CheckStatus, { mark: string; cls: string; label: string }> = {
  pass: { mark: "✓", cls: "bg-[#DCF3E5] text-[#1F7A45]", label: "Good" },
  warn: { mark: "!", cls: "bg-gold-soft text-ink", label: "Could be better" },
  fail: { mark: "✕", cls: "bg-red-50 text-red-700", label: "Fix this" },
};

/**
 * The ATS score analyst tab: a live score for how well the resume gets
 * through applicant tracking systems, the checks behind it, keyword match
 * for a pasted job post, and an optional AI read-out with rewrites.
 */
export function AtsPanel({
  data,
  template,
  guest = false,
  onFix,
}: {
  data: ResumeData;
  template: string;
  guest?: boolean;
  /** Opens the builder at a section ("experience", "design"...). */
  onFix: (section: string) => void;
}) {
  const [jd, setJd] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [advice, setAdvice] = useState<AnalystAdvice | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; upgrade?: boolean; signup?: boolean } | null>(null);

  // A job post pasted on the homepage demo or saved in the Applications tracker.
  useEffect(() => {
    try {
      const pending = window.localStorage.getItem("lettr_pending_jd");
      // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only storage, must run after mount
      if (pending) setJd((cur) => cur || pending);
    } catch {
      // storage unavailable
    }
  }, []);

  const report = useMemo(() => analyzeAts(data, template, jd), [data, template, jd]);

  async function askAnalyst() {
    if (guest) {
      setError({ text: "The analyst's advice comes with a free account.", signup: true });
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/ats-analyst", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: data, template, jobPost: jd.trim().length >= 30 ? jd : undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ text: body.error ?? "The analyst couldn't finish. Try again.", upgrade: body.upgradeRequired, signup: body.signup });
        return;
      }
      setAdvice(body.advice);
    } catch {
      setError({ text: "Couldn't reach the server. Try again." });
    } finally {
      setBusy(false);
    }
  }

  const fixButton = (c: AtsCheck) =>
    c.section ? (
      <button type="button" onClick={() => onFix(c.section!)} className="shrink-0 min-h-9 px-3 rounded-full border-2 border-ink text-xs font-bold bg-white hover:bg-sand">
        Fix
      </button>
    ) : null;

  return (
    <div className="max-w-xl space-y-5">
      <section className="bg-white border-2 border-ink rounded-[24px] shadow-[5px_5px_0_var(--ink)] p-5">
        <div className="flex items-center gap-4">
          <ScoreRing value={report.overall} size={92} strokeWidth={9} />
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-wide text-slate">ATS score</p>
            <p className="font-extrabold text-lg leading-snug">{report.verdict}</p>
            <p className="text-xs text-slate mt-1">Updates as you edit. {report.keywords ? "Includes keyword match for your job post." : "Paste a job post below to add keyword matching."}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-4">
          {report.categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setOpen(open === cat.id ? null : cat.id)}
              aria-expanded={open === cat.id}
              className={`text-left rounded-2xl px-3 py-2.5 border-2 ${open === cat.id ? "border-ink" : "border-rule"} hover:border-ink`}
            >
              <span className="flex justify-between text-sm font-bold">
                <span className="truncate">{cat.label}</span>
                <span>{cat.score}</span>
              </span>
              <span className="block h-1.5 bg-sand rounded-full mt-1.5 overflow-hidden">
                <span
                  className={`block h-full rounded-full ${cat.score >= 80 ? "bg-[#1F9D55]" : cat.score >= 55 ? "bg-gold-deep" : "bg-red-500"}`}
                  style={{ width: `${cat.score}%` }}
                />
              </span>
            </button>
          ))}
        </div>
        {open && (
          <ul className="mt-4 space-y-3">
            {report.categories
              .find((c) => c.id === open)!
              .checks.map((c) => (
                <CheckRow key={c.id} c={c} fix={fixButton(c)} />
              ))}
          </ul>
        )}
      </section>

      {report.topFixes.length > 0 && (
        <section className="bg-white border border-rule rounded-[24px] p-5">
          <h3 className="font-extrabold mb-3">Fix these first</h3>
          <ul className="space-y-3">
            {report.topFixes.map((c) => (
              <CheckRow key={c.id} c={c} fix={fixButton(c)} />
            ))}
          </ul>
        </section>
      )}

      <section className="bg-white border border-rule rounded-[24px] p-5">
        <h3 className="font-extrabold">Match it to a job</h3>
        <p className="text-sm text-slate mt-1 mb-2">Paste the job post. Lettr checks the key terms the company&apos;s system will look for.</p>
        <textarea
          value={jd}
          onChange={(e) => setJd(e.target.value)}
          rows={6}
          aria-label="Job post"
          placeholder="Paste the full job posting here…"
          className="w-full border-2 border-rule rounded-xl px-3 py-2.5 text-[15px] bg-white focus:outline-none focus:border-brand-blue"
        />
        {report.keywords && (
          <div className="mt-4">
            <p className="text-sm font-bold">
              {report.keywords.matchedKeywords.length} of {report.keywords.totalKeywords} key terms found ({report.keywords.score}%)
            </p>
            {report.keywords.missingKeywords.length > 0 && (
              <>
                <p className="text-xs text-slate mt-2 mb-1.5">Missing. Add the ones that are true for you to your skills, summary or bullets:</p>
                <div className="flex flex-wrap gap-1.5">
                  {report.keywords.missingKeywords.map((k) => (
                    <span key={k} className="text-xs font-bold bg-red-50 text-red-700 px-2 py-1 rounded-xl">
                      {k}
                    </span>
                  ))}
                </div>
              </>
            )}
            {report.keywords.matchedKeywords.length > 0 && (
              <>
                <p className="text-xs text-slate mt-3 mb-1.5">Found:</p>
                <div className="flex flex-wrap gap-1.5">
                  {report.keywords.matchedKeywords.map((k) => (
                    <span key={k} className="text-xs font-bold bg-brand-blue-soft text-brand-blue px-2 py-1 rounded-xl">
                      {k}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </section>

      <section className="bg-gold-soft rounded-[24px] p-5">
        <h3 className="font-extrabold">✦ Ask the ATS analyst</h3>
        <p className="text-sm text-slate mt-1">
          Get a plain-English read of your score and rewrites of your own bullets that would rank better. Free accounts get 3 a month.
        </p>
        <button
          type="button"
          onClick={askAnalyst}
          disabled={busy}
          className="btn-press mt-3 inline-flex items-center min-h-11 px-5 rounded-full bg-ink text-white font-bold disabled:opacity-60"
        >
          {busy ? "Analysing…" : advice ? "Ask again" : "Ask the analyst"}
        </button>
        {error && (
          <p className="text-sm text-red-700 mt-3">
            {error.text}{" "}
            {error.signup && (
              <Link href="/signup?continue=builder" className="font-bold underline">
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
        {advice && (
          <div className="mt-4 space-y-3" aria-live="polite">
            <p className="leading-relaxed">{advice.summary}</p>
            {advice.fixes.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-4">
                <p className="font-bold">
                  {i + 1}. {f.title}
                </p>
                <p className="text-sm text-slate mt-1">{f.why}</p>
                {f.example && <p className="text-sm mt-2 border-l-4 border-gold-deep pl-3">{f.example}</p>}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CheckRow({ c, fix }: { c: AtsCheck; fix: React.ReactNode }) {
  const i = ICON[c.status];
  return (
    <li className="flex items-start gap-3">
      <span aria-label={i.label} className={`w-7 h-7 shrink-0 rounded-full flex items-center justify-center text-sm font-extrabold ${i.cls}`}>
        {i.mark}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold leading-snug">{c.label}</p>
        {c.detail && <p className="text-sm text-slate">{c.detail}</p>}
      </div>
      {c.status !== "pass" && fix}
    </li>
  );
}
