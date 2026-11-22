"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ResumeData } from "@/lib/types";
import { marketOf } from "@/lib/market";
import { scoreResumeQuality } from "@/lib/resume-score";
import { applyEdits, fixesFor, readLoc, undoEdits, type Edit, type Fix } from "@/lib/resume-fixes";
import type { Allowance } from "@/lib/free-usage";
import type { UsagePeriod } from "@/lib/limits";

const BTN = "inline-flex items-center justify-center min-h-11 px-4 rounded-full text-sm font-bold disabled:opacity-60";

function whereLabel(e: Edit): string {
  switch (e.loc.t) {
    case "summary": return "Summary";
    case "bullet": return "Experience bullet";
    case "projDesc":
    case "projBullet":
    case "tech": return "Project";
    case "achievement": return "Achievement";
    case "skill":
    case "groupSkill": return "Skill";
    case "contact": return e.loc.field === "dateOfBirth" ? "Date of birth" : "Nationality";
    case "photo": return "Photo";
  }
}

/** Before and after as labelled text (not colour alone), stacked on a phone and side by side from md. */
function Diff({ edit }: { edit: Edit }) {
  const show = (s: string) => (s === "" ? "(removed)" : s);
  return (
    <div className="rounded-xl border border-rule bg-cream p-3">
      <p className="text-xs font-bold uppercase tracking-wide text-slate mb-2">{whereLabel(edit)}</p>
      <div className="grid gap-2 md:grid-cols-2">
        <p className="text-sm text-ink break-words">
          <span className="font-bold">Before: </span>
          <span className="line-through decoration-red-500/70">{show(edit.before)}</span>
        </p>
        <p className="text-sm text-ink break-words">
          <span className="font-bold">After: </span>
          <span className="font-semibold">{show(edit.after)}</span>
        </p>
      </div>
    </div>
  );
}

/**
 * One card per fixable accuracy tip. Nothing changes until Accept; Undo puts
 * back exactly what Accept changed (and refuses if those places were edited
 * since). Rule-based fixes are free; the AI rewrite uses the free allowance.
 */
export function FixesPanel({
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
  const fixes = useMemo(() => fixesFor(data), [data]);
  const score = scoreResumeQuality(data).overall;
  const market = marketOf(data.customization);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [pick, setPick] = useState<Record<string, number>>({});
  const [options, setOptions] = useState<Record<string, string[]>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; text: string; upgrade: boolean } | null>(null);
  const [undo, setUndo] = useState<{ title: string; edits: Edit[]; scoreBefore: number } | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [aiUsed, setAiUsed] = useState(0);

  const shown = fixes.filter((f) => !skipped.includes(f.id));
  const left = allowance && Number.isFinite(allowance.limit) ? Math.max(0, allowance.limit - allowance.used - aiUsed) : null;

  function accept(title: string, edits: Edit[]) {
    const next = applyEdits(data, edits);
    if (!next) return setNote("That text changed since this was shown, so nothing was changed. The list has been refreshed.");
    setUndo({ title, edits, scoreBefore: score });
    setData(next);
    setNote(`Done: ${title}.`);
  }
  function undoLast() {
    if (!undo) return;
    const back = undoEdits(data, undo.edits);
    setUndo(null);
    if (!back) return setNote("Those places were edited since, so I left them alone. Change them by hand.");
    setData(back);
    setNote("Put back as it was.");
  }

  async function rewrite(f: Fix) {
    if (!f.ai) return;
    setBusy(f.id);
    setError(null);
    try {
      const res = await fetch("/api/ai/fix-bullet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bullet: f.ai.bullet, role: f.ai.role, market: market ?? undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError({ id: f.id, text: body.error ?? "Couldn't rewrite this. Please try again.", upgrade: Boolean(body.upgradeRequired) });
        return;
      }
      setOptions((o) => ({ ...o, [f.id]: Array.isArray(body.options) ? body.options : [] }));
      setAiUsed((n) => n + 1);
    } catch {
      setError({ id: f.id, text: "Couldn't reach the server. Check your connection and try again.", upgrade: false });
    } finally {
      setBusy(null);
    }
  }

  if (shown.length === 0 && !undo) return null;

  return (
    <section aria-label="Fix these" className="bg-white border-2 border-rule rounded-2xl p-4 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-brand font-extrabold text-lg text-ink">Fix these</h2>
        <span className="text-sm text-ink-soft">Score {score}{undo && undo.scoreBefore !== score ? ` (was ${undo.scoreBefore})` : ""}</span>
      </div>
      <p aria-live="polite" className="text-sm font-bold text-ink empty:hidden">{note}</p>
      {undo && (
        <button type="button" onClick={undoLast} className={`${BTN} border-2 border-rule bg-white text-brand-blue hover:border-ink`}>
          Undo: {undo.title}
        </button>
      )}

      <ul className="space-y-3">
        {shown.map((f) => (
          <li key={f.id} className="rounded-xl border-2 border-rule p-3 space-y-2">
            <p className="font-bold text-ink">{f.title}</p>

            {f.kind === "rule" && (
              <>
                {f.edits.slice(0, 6).map((e, i) => <Diff key={i} edit={e} />)}
                {f.edits.length > 6 && <p className="text-xs text-ink-soft">and {f.edits.length - 6} more</p>}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => accept(f.title, f.edits)} className={`${BTN} bg-brand-blue text-white`}>Accept</button>
                  <button type="button" onClick={() => setSkipped((s) => [...s, f.id])} className={`${BTN} border-2 border-rule bg-white text-ink hover:border-ink`}>Skip</button>
                </div>
              </>
            )}

            {f.kind === "choice" && f.choices && (
              <>
                <p className="text-sm text-ink-soft">Pick where it stays. The other place gets a [X] blank for you to fill in with the real figure.</p>
                <div role="radiogroup" aria-label="Where to keep the figure" className="space-y-1">
                  {f.choices.map((c, k) => (
                    <label key={k} className="flex items-center gap-2 min-h-11 text-sm font-bold text-ink">
                      <input type="radio" name={`pick-${f.id}`} checked={(pick[f.id] ?? 0) === k} onChange={() => setPick((p) => ({ ...p, [f.id]: k }))} />
                      {c.label}
                    </label>
                  ))}
                </div>
                {f.choices[pick[f.id] ?? 0].edits.slice(0, 6).map((e, i) => <Diff key={i} edit={e} />)}
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => accept(f.title, f.choices![pick[f.id] ?? 0].edits)} className={`${BTN} bg-brand-blue text-white`}>Accept</button>
                  <button type="button" onClick={() => setSkipped((s) => [...s, f.id])} className={`${BTN} border-2 border-rule bg-white text-ink hover:border-ink`}>It is true in both. Skip</button>
                </div>
              </>
            )}

            {f.kind === "ai" && f.ai && (
              <>
                <p className="text-sm text-ink break-words">{f.ai.bullet}</p>
                {!options[f.id] && (
                  <div className="flex flex-wrap items-center gap-3">
                    {guest ? (
                      <Link href="/signup?continue=builder" className="text-sm font-bold text-brand-blue hover:underline">Create a free account to use AI fixes</Link>
                    ) : (
                      <button type="button" onClick={() => rewrite(f)} disabled={busy !== null} className={`${BTN} bg-brand-blue text-white`}>
                        {busy === f.id ? "Rewriting…" : "Rewrite with AI"}
                      </button>
                    )}
                    {!guest && allowance && (
                      <span className="text-sm text-ink-soft">{left === null ? "Unlimited" : `${left} ${period === "month" ? "left this month" : "free left"}`}</span>
                    )}
                    <button type="button" onClick={() => setSkipped((s) => [...s, f.id])} className={`${BTN} border-2 border-rule bg-white text-ink hover:border-ink`}>Skip</button>
                  </div>
                )}
                {error?.id === f.id && (
                  <p role="alert" className="text-sm font-bold text-red-600">
                    {error.text} {error.upgrade && <Link href="/pricing" className="underline text-brand-blue">See Pro</Link>}
                  </p>
                )}
                {options[f.id]?.map((o) => {
                  const live = readLoc(data, f.ai!.loc);
                  const edit: Edit = { loc: f.ai!.loc, before: live ?? f.ai!.bullet, after: o };
                  return (
                    <div key={o} className="space-y-2">
                      <Diff edit={edit} />
                      <button type="button" onClick={() => accept("Rewrote a bullet", [edit])} className={`${BTN} border-2 border-ink bg-white text-ink hover:bg-ink hover:text-white`}>Use this</button>
                    </div>
                  );
                })}
                {options[f.id] && <p className="text-xs text-ink-soft">Anything in [square brackets] is a blank for your real figure.</p>}
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
