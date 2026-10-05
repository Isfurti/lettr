"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NewResumeButton } from "@/components/NewResumeButton";
import { TemplateThumbnail } from "@/components/TemplateThumbnail";
import { formatDate } from "@/lib/format-date";
import type { ResumeData } from "@/lib/types";
import { displayTitle } from "@/lib/resume-title";

type ResumeCard = {
  id: string;
  title: string;
  template: string;
  updated_at: string;
  score: number;
  data: ResumeData;
};

export function ResumeSearch({
  resumes,
  atResumeLimit,
}: {
  resumes: ResumeCard[];
  atResumeLimit: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const filtered = query.trim()
    ? resumes.filter((r) => displayTitle(r).toLowerCase().includes(query.trim().toLowerCase()))
    : resumes;

  async function duplicate(r: ResumeCard) {
    setBusyId(r.id);
    setError(null);
    const res = await fetch("/api/resumes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: `${displayTitle(r)} (copy)`, template: r.template, data: r.data }),
    });
    setBusyId(null);
    if (res.status === 402) {
      setError("Your plan's resume limit is reached — upgrade to Pro for unlimited resumes.");
      return;
    }
    if (!res.ok) {
      setError("Couldn't duplicate that resume. Please try again.");
      return;
    }
    const body = await res.json();
    router.push(`/builder/${body.id}`);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between mb-5 gap-3">
        <h2 className="font-brand font-extrabold text-[28px] tracking-tight shrink-0">Your resumes</h2>
        {resumes.length > 3 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resumes…"
            aria-label="Search resumes"
            className="border-2 border-rule rounded-full px-4 min-h-11 text-[15px] bg-white focus:outline-none focus:border-brand-blue w-full sm:w-64"
          />
        )}
      </div>

      {error && (
        <p className="mb-4 text-sm bg-red-50 text-red-700 rounded-xl px-4 py-3">
          {error}{" "}
          {error.includes("Pro") && (
            <Link href="/pricing" className="underline font-bold">See Pro →</Link>
          )}
        </p>
      )}

      {resumes.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#C9D1E3] rounded-3xl p-10 text-center">
          <p className="text-slate mb-4">You haven&apos;t created a resume yet.</p>
          <NewResumeButton label="Create your first resume" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-slate bg-white rounded-3xl border border-rule p-6 text-center">
          No resumes match &quot;{query}&quot;.
        </p>
      ) : (
        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((r) => (
            <div key={r.id} className="flex flex-col group">
              <Link
                href={`/builder/${r.id}`}
                className="lift relative block bg-white rounded-2xl border border-rule p-3 shadow-[0_10px_24px_rgba(4,22,50,0.08)]"
                aria-label={`Open ${displayTitle(r)}`}
              >
                <div className="aspect-[1/1.2] rounded-md overflow-hidden">
                  <TemplateThumbnail id={r.template} data={r.data} renderWidth={560} />
                </div>
                <span
                  title="Resume score"
                  className={`absolute -right-2 -bottom-3 w-[60px] h-[60px] rounded-full flex flex-col items-center justify-center font-brand font-extrabold leading-none ${
                    r.score >= 80
                      ? "bg-gold text-ink rotate-[8deg] shadow-[0_5px_0_var(--gold-deep)]"
                      : "bg-white text-slate border-[3px] border-dashed border-[#A3AEC6]"
                  }`}
                >
                  <span className="text-[22px]">{r.score}</span>
                  {r.score >= 80 && <span className="font-sans text-[9px] mt-0.5">Ready</span>}
                </span>
              </Link>
              <div className="mt-4 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link href={`/builder/${r.id}`} className="block font-extrabold truncate hover:text-brand-blue">
                    {displayTitle(r)}
                  </Link>
                  <p className="text-sm text-slate truncate">
                    Edited {formatDate(r.updated_at)} · {r.template[0].toUpperCase() + r.template.slice(1)}
                  </p>
                </div>
                <button
                  onClick={() => duplicate(r)}
                  disabled={busyId === r.id}
                  className="min-h-11 px-2 text-sm font-bold text-slate hover:text-brand-blue shrink-0 disabled:opacity-60"
                >
                  {busyId === r.id ? "Copying…" : "Duplicate"}
                </button>
              </div>
            </div>
          ))}
          {!atResumeLimit && !query && (
            <div className="border-2 border-dashed border-[#C9D1E3] rounded-2xl aspect-[1/1.2] flex flex-col items-center justify-center gap-3 p-6 text-center bg-white/50">
              <span aria-hidden="true" className="w-12 h-12 rounded-full bg-gold text-ink text-3xl font-extrabold flex items-center justify-center shadow-[0_4px_0_var(--gold-deep)]">+</span>
              <NewResumeButton label="New resume" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
