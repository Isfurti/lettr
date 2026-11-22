"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ResumeData } from "@/lib/types";
import { marketOf } from "@/lib/market";
import { applyTailorChanges, MIN_JOB_POST_CHARS, type TailorChange } from "@/lib/tailor";
import type { Allowance } from "@/lib/free-usage";
import type { UsagePeriod } from "@/lib/limits";

const BTN = "inline-flex items-center justify-center min-h-11 px-4 rounded-full text-sm font-bold disabled:opacity-60";

type Proposal = {
  gaps: string[];
  matched: string[];
  skillOrder: string[] | null;
  skillNote: string | null;
  summaryOptions: string[];
  bullets: { id: string; i: number; before: string; options: string[] }[];
  noSafeRewrite: { id: string; i: number }[];
};

/**
 * Tailor to a job post. Shows a proposal and lets the person pick, change by
 * change. Nothing here touches the open resume: the picks are applied to a
 * copy and saved as a NEW version (Pro), so autosave can never write them
 * into the original.
 */
export function TailorPanel({
  data,
  resumeId,
  jobPost,
  setJobPost,
  isPro,
  allowance,
  period,
}: {
  data: ResumeData;
  resumeId: string;
  jobPost: string;
  setJobPost: (v: string) => void;
  isPro: boolean;
  allowance?: Allowance;
  period?: UsagePeriod;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<{ text: string; upgrade: boolean } | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [base, setBase] = useState<ResumeData | null>(null); // the resume the proposal was made from
  const [summaryPick, setSummaryPick] = useState<number | null>(null);
  const [bulletPick, setBulletPick] = useState<Record<string, number | null>>({});
  const [skillsPick, setSkillsPick] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [used, setUsed] = useState(0);

  const left = allowance && Number.isFinite(allowance.limit) ? Math.max(0, allowance.limit - allowance.used - used) : null;
  const tooShort = jobPost.trim().length < MIN_JOB_POST_CHARS;

  async function run() {
    setBusy(true);
    setError(null);
    setProposal(null);
    try {
      const res = await fetch("/api/ai/tailor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: data, jobPost, market: marketOf(data.customization) ?? undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError({ text: json.error ?? "Something went wrong. Try again.", upgrade: !!json.upgradeRequired });
      setProposal(json);
      setBase(data);
      setSummaryPick(null);
      setBulletPick({});
      setSkillsPick(false);
      setUsed((u) => u + 1);
    } catch {
      setError({ text: "Couldn't reach Lettr. Check your connection and try again.", upgrade: false });
    } finally {
      setBusy(false);
    }
  }

  function chosenChanges(): TailorChange[] {
    if (!proposal || !base) return [];
    const out: TailorChange[] = [];
    if (skillsPick && proposal.skillOrder) out.push({ kind: "skills", before: base.skills, after: proposal.skillOrder });
    if (summaryPick !== null) out.push({ kind: "summary", before: base.summary, after: proposal.summaryOptions[summaryPick] });
    for (const b of proposal.bullets) {
      const pick = bulletPick[`${b.id}:${b.i}`];
      if (pick !== null && pick !== undefined) out.push({ kind: "bullet", id: b.id, i: b.i, before: b.before, after: b.options[pick] });
    }
    return out;
  }

  async function save() {
    if (!base) return;
    const changes = chosenChanges();
    const tailored = applyTailorChanges(base, changes);
    if (!tailored) return setError({ text: "Your resume changed since this was made. Tailor again to get fresh suggestions.", upgrade: false });
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/resumes/${resumeId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || "Tailored", data: tailored }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) return setError({ text: json.error ?? "Couldn't save the version.", upgrade: !!json.upgradeRequired });
      router.push(`/builder/${json.id}`);
    } catch {
      setError({ text: "Couldn't reach Lettr. Try again.", upgrade: false });
    } finally {
      setSaving(false);
    }
  }

  const changeCount = chosenChanges().length;

  return (
    <section aria-labelledby="tailor-h" className="space-y-4">
      <div>
        <h2 id="tailor-h" className="font-display text-xl font-bold text-ink">Tailor to a job</h2>
        <p className="text-sm text-slate mt-1">
          Paste a job post. Lettr suggests wording that fits it, using only what is already on your resume. Your original is never changed: accepted changes are saved as a new version.
        </p>
      </div>

      <label className="block">
        <span className="text-sm font-bold text-ink">Job post</span>
        <textarea
          value={jobPost}
          onChange={(e) => setJobPost(e.target.value)}
          rows={7}
          maxLength={8000}
          className="mt-1 w-full rounded-xl border border-rule bg-white p-3 text-sm text-ink"
          placeholder="Paste the full job description here"
        />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" onClick={run} disabled={busy || tooShort || left === 0} className={`${BTN} bg-ink text-white`}>
          {busy ? "Tailoring..." : "Tailor my resume"}
        </button>
        {left !== null && (
          <span className="text-sm text-slate">
            {left === 0 ? "No tries left" : `${left} ${period === "month" ? "left this month" : "free try left"}`}
          </span>
        )}
        {tooShort && jobPost.length > 0 && <span className="text-sm text-slate">Paste a longer job post.</span>}
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error.text} {error.upgrade && <Link href="/pricing" className="underline text-brand-blue">See Pro</Link>}
        </p>
      )}

      {proposal && (
        <div className="space-y-4" aria-live="polite">
          <div className="rounded-xl border border-rule bg-cream p-3">
            <p className="text-sm font-bold text-ink">Not on your resume</p>
            {proposal.gaps.length ? (
              <>
                <p className="text-sm text-slate mt-1">The job asks for these and your resume does not show them. Add one only if it is true for you.</p>
                <ul className="mt-2 flex flex-wrap gap-2">
                  {proposal.gaps.map((g) => (
                    <li key={g} className="rounded-full border border-rule bg-white px-3 py-1 text-sm text-ink">{g}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-sm text-slate mt-1">Nothing important is missing.</p>
            )}
          </div>

          {proposal.skillOrder && (
            <label className="flex items-start gap-3 rounded-xl border border-rule bg-white p-3 min-h-11">
              <input type="checkbox" checked={skillsPick} onChange={(e) => setSkillsPick(e.target.checked)} className="mt-1 h-5 w-5" />
              <span className="text-sm text-ink">
                <span className="font-bold">Put the skills the job asks for first.</span>
                <span className="block text-slate break-words">Before: {data.skills.join(", ")}</span>
                <span className="block break-words">After: {proposal.skillOrder.join(", ")}</span>
              </span>
            </label>
          )}
          {proposal.skillNote && <p className="text-sm text-slate">{proposal.skillNote}</p>}

          {proposal.summaryOptions.length > 0 && (
            <fieldset className="rounded-xl border border-rule bg-white p-3">
              <legend className="px-1 text-sm font-bold text-ink">Summary</legend>
              <p className="text-sm text-slate break-words"><span className="font-bold">Before: </span>{data.summary}</p>
              {proposal.summaryOptions.map((o, n) => (
                <label key={n} className="mt-2 flex items-start gap-3 min-h-11">
                  <input type="radio" name="tailor-summary" checked={summaryPick === n} onChange={() => setSummaryPick(n)} className="mt-1 h-5 w-5" />
                  <span className="text-sm text-ink break-words"><span className="font-bold">After {n + 1}: </span>{o}</span>
                </label>
              ))}
              <button type="button" onClick={() => setSummaryPick(null)} className="mt-2 text-sm font-bold text-brand-blue hover:underline min-h-11">Keep my summary</button>
            </fieldset>
          )}

          {proposal.bullets.map((b) => {
            const key = `${b.id}:${b.i}`;
            return (
              <fieldset key={key} className="rounded-xl border border-rule bg-white p-3">
                <legend className="px-1 text-sm font-bold text-ink">Experience bullet</legend>
                <p className="text-sm text-slate break-words"><span className="font-bold">Before: </span>{b.before}</p>
                {b.options.map((o, n) => (
                  <label key={n} className="mt-2 flex items-start gap-3 min-h-11">
                    <input type="radio" name={`tailor-${key}`} checked={bulletPick[key] === n} onChange={() => setBulletPick((p) => ({ ...p, [key]: n }))} className="mt-1 h-5 w-5" />
                    <span className="text-sm text-ink break-words"><span className="font-bold">After {n + 1}: </span>{o}</span>
                  </label>
                ))}
                <button type="button" onClick={() => setBulletPick((p) => ({ ...p, [key]: null }))} className="mt-2 text-sm font-bold text-brand-blue hover:underline min-h-11">Keep my bullet</button>
              </fieldset>
            );
          })}
          {proposal.noSafeRewrite.length > 0 && (
            <p className="text-sm text-slate">{proposal.noSafeRewrite.length} bullet(s) were left as they are because a rewrite would have added something you did not write.</p>
          )}

          <div className="rounded-xl border border-rule bg-cream p-3 space-y-3">
            <label className="block">
              <span className="text-sm font-bold text-ink">Name this version</span>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="For example: Legal assistant" className="mt-1 w-full rounded-xl border border-rule bg-white px-3 min-h-11 text-sm text-ink" />
            </label>
            {isPro ? (
              <button type="button" onClick={save} disabled={saving || changeCount === 0} className={`${BTN} bg-gold text-ink`}>
                {saving ? "Saving..." : changeCount === 0 ? "Pick a change to save" : `Save as new version (${changeCount} change${changeCount === 1 ? "" : "s"})`}
              </button>
            ) : (
              <p className="text-sm text-ink">
                Saving a tailored version is a Pro feature. <Link href="/pricing" className="underline text-brand-blue font-bold">See Pro</Link>
              </p>
            )}
            <p className="text-xs text-slate">Your original resume stays as it is.</p>
          </div>
        </div>
      )}
    </section>
  );
}
