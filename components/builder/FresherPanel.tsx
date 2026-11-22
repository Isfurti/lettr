"use client";

import { useState } from "react";
import Link from "next/link";
import type { ResumeData } from "@/lib/types";
import { marketOf } from "@/lib/market";
import { hiddenSections } from "@/lib/layout";
import {
  FRESHER_KINDS,
  FRESHER_LIMITS,
  addFresherItem,
  applyFresherPath,
  fresherAnswersProblem,
  fresherGuidance,
  isFresher,
  type FresherAnswers,
  type FresherKind,
} from "@/lib/fresher";
import type { Allowance } from "@/lib/free-usage";
import type { UsagePeriod } from "@/lib/limits";

const FIELD =
  "mt-1 w-full border-2 border-rule rounded-xl px-3 py-2 min-h-11 text-[15px] bg-white placeholder:text-ink-soft/50 focus:outline-none focus:border-brand-blue";
const BTN =
  "inline-flex items-center justify-center min-h-11 px-4 rounded-full text-sm font-bold disabled:opacity-60";

const EMPTY: FresherAnswers = { kind: "project", name: "", what: "", tools: "", result: "" };

/** "Little or no experience" path: layout switch, short guidance and guided bullet drafting. Every change is shown first and can be undone. */
export function FresherPanel({
  data,
  setData,
  guest = false,
  allowance,
  period,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  guest?: boolean;
  allowance?: Allowance;
  period?: UsagePeriod;
}) {
  const on = isFresher(data.customization);
  const market = marketOf(data.customization);
  const [undoLayout, setUndoLayout] = useState<ResumeData["customization"] | null>(null);
  const [undoAdd, setUndoAdd] = useState<ResumeData | null>(null);
  const [answers, setAnswers] = useState<FresherAnswers>(EMPTY);
  const [options, setOptions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const kind = FRESHER_KINDS.find((k) => k.id === answers.kind) ?? FRESHER_KINDS[0];
  const targetKey = kind.id === "competition" ? "achievements" : kind.id === "club" ? "custom" : "projects";
  const targetHidden = hiddenSections(data.customization).includes(targetKey);
  const set = <K extends keyof FresherAnswers>(k: K, v: FresherAnswers[K]) => {
    setAnswers((a) => ({ ...a, [k]: v }));
    setOptions([]);
  };

  function turnOn() {
    setUndoLayout(data.customization ?? {});
    setData((d) => ({ ...d, customization: applyFresherPath(d.customization) }));
    setNote("Fresher layout is on: Education, Projects, Skills and Achievements now come before Experience.");
  }
  function undoTurnOn() {
    if (!undoLayout) return;
    const back = undoLayout;
    setData((d) => ({ ...d, customization: back }));
    setUndoLayout(null);
    setNote("Back to your earlier layout.");
  }
  function turnOff() {
    setData((d) => {
      const c = { ...(d.customization ?? {}) };
      delete c.fresher;
      return { ...d, customization: c };
    });
    setNote("Fresher layout is off. Your section order is unchanged; change it in Design.");
  }

  async function draft() {
    const problem = fresherAnswersProblem(answers);
    if (problem) return setError(problem);
    setBusy(true);
    setError(null);
    setUpgrade(false);
    setNote(null);
    try {
      const res = await fetch("/api/ai/fresher-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...answers, market: market ?? undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUpgrade(Boolean(body.upgradeRequired));
        setError(body.error ?? "Couldn't draft a bullet. Please try again.");
        return;
      }
      setOptions(Array.isArray(body.options) ? body.options : []);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function use(bullet: string) {
    setUndoAdd(data);
    setData((d) => addFresherItem(d, answers, bullet, () => crypto.randomUUID()));
    setNote(`Added to ${kind.where}. You can edit it there.`);
    setOptions([]);
    setAnswers({ ...EMPTY, kind: answers.kind });
  }
  function undoLastAdd() {
    if (!undoAdd) return;
    const back = undoAdd;
    setData(() => back);
    setUndoAdd(null);
    setNote("Removed what you just added.");
  }

  const left = allowance && Number.isFinite(allowance.limit) ? Math.max(0, allowance.limit - allowance.used) : null;

  return (
    <section aria-label="Little or no experience" className="bg-white border-2 border-rule rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-brand font-extrabold text-lg text-ink">Little or no experience?</h2>
        {on ? (
          <button type="button" onClick={turnOff} className={`${BTN} border-2 border-rule bg-white text-ink hover:border-ink`}>
            Turn off fresher layout
          </button>
        ) : (
          <button type="button" onClick={turnOn} className={`${BTN} bg-brand-blue text-white`}>
            Use the fresher layout
          </button>
        )}
      </div>
      {!on && (
        <p className="text-sm text-ink-soft">
          Puts Education, Projects, Skills and Achievements first, with internships and volunteering after. You can undo it.
        </p>
      )}

      <div aria-live="polite" className="text-sm font-bold text-ink">
        {note}{" "}
        {undoLayout && (
          <button type="button" onClick={undoTurnOn} className="underline text-brand-blue">
            Undo layout
          </button>
        )}
        {undoAdd && (
          <button type="button" onClick={undoLastAdd} className="underline text-brand-blue">
            Undo add
          </button>
        )}
      </div>

      {on && (
        <>
          <details className="rounded-xl bg-cream border border-rule p-3">
            <summary className="cursor-pointer min-h-8 text-sm font-bold text-ink">What to include and leave out</summary>
            <ul className="mt-2 space-y-2 text-sm text-ink">
              {fresherGuidance(market).map((t) => (
                <li key={t.title}>
                  <span className="font-bold">{t.title}: </span>
                  {t.text}
                </li>
              ))}
            </ul>
          </details>

          <fieldset className="space-y-3">
            <legend className="text-sm font-bold text-ink mb-1">Turn something you have done into a bullet</legend>
            <div role="group" aria-label="What kind of thing" className="flex flex-wrap gap-2">
              {FRESHER_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  aria-pressed={answers.kind === k.id}
                  onClick={() => set("kind", k.id as FresherKind)}
                  className={`${BTN} border-2 ${answers.kind === k.id ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
            <label className="block">
              <span className="text-sm font-bold text-slate">Name</span>
              <input className={FIELD} value={answers.name} maxLength={FRESHER_LIMITS.name} placeholder={kind.namePlaceholder} onChange={(e) => set("name", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate">{kind.what}</span>
              <textarea className={FIELD} rows={3} value={answers.what} maxLength={FRESHER_LIMITS.what} onChange={(e) => set("what", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate">Tools or skills used (optional)</span>
              <input className={FIELD} value={answers.tools} maxLength={FRESHER_LIMITS.tools} placeholder="Python, Excel, Figma" onChange={(e) => set("tools", e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-bold text-slate">Result or number (optional)</span>
              <input className={FIELD} value={answers.result} maxLength={FRESHER_LIMITS.result} placeholder="120 students used it; we placed 2nd of 40 teams" onChange={(e) => set("result", e.target.value)} />
            </label>
            {targetHidden && (
              <p className="text-sm text-ink-soft">The section this goes in is hidden on your resume. Show it in Design after adding.</p>
            )}

            {guest ? (
              <p className="text-sm text-ink-soft">
                <Link href="/signup?continue=builder" className="font-bold text-brand-blue hover:underline">
                  Create a free account
                </Link>{" "}
                to draft bullets.
              </p>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={draft} disabled={busy} className={`${BTN} bg-brand-blue text-white`}>
                  {busy ? "Drafting…" : "Draft a bullet"}
                </button>
                {allowance && (
                  <span className="text-sm text-ink-soft">
                    {left === null ? "Unlimited drafts" : `${left} ${period === "month" ? "left this month" : "free left"}`}
                  </span>
                )}
              </div>
            )}
          </fieldset>

          {error && (
            <p role="alert" className="text-sm font-bold text-red-600">
              {error}{" "}
              {upgrade && (
                <Link href="/pricing" className="underline text-brand-blue">
                  See Pro
                </Link>
              )}
            </p>
          )}

          {options.length > 0 && (
            <div className="space-y-2" aria-label="Draft options">
              <p className="text-sm font-bold text-ink">Pick one to add, or change the answers above and draft again.</p>
              <ul className="space-y-2">
                {options.map((o) => (
                  <li key={o} className="rounded-xl border-2 border-rule bg-cream p-3">
                    <p className="text-[15px] text-ink">{o}</p>
                    <button type="button" onClick={() => use(o)} className={`${BTN} mt-2 border-2 border-ink bg-white text-ink hover:bg-ink hover:text-white`}>
                      Add this
                    </button>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-ink-soft">Anything in [square brackets] is a blank for you to fill in with your real figure.</p>
            </div>
          )}
        </>
      )}
    </section>
  );
}
