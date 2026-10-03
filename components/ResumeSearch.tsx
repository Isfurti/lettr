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
      <div className="flex flex-wrap items-center justify-between mb-4 gap-3">
        <h2 className="font-display font-semibold text-xl shrink-0">My Resumes</h2>
        {resumes.length > 3 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resumes…"
            aria-label="Search resumes"
            className="border border-rule rounded-sm px-3 py-1.5 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40 w-full sm:w-56"
          />
        )}
      </div>

      {error && (
        <p className="mb-4 text-sm bg-red-50 text-red-700 rounded-sm px-4 py-2">
          {error}{" "}
          {error.includes("Pro") && (
            <Link href="/pricing" className="underline font-medium">See Pro →</Link>
          )}
        </p>
      )}

      {resumes.length === 0 ? (
        <div className="paper-sheet rounded-sm p-10 text-center">
          <p className="text-ink-soft mb-4">You haven&apos;t created a resume yet.</p>
          <NewResumeButton label="Create your first resume" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-ink-soft paper-sheet rounded-sm p-6 text-center">
          No resumes match &quot;{query}&quot;.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((r) => (
            <div key={r.id} className="paper-sheet rounded-sm p-4 flex flex-col group">
              <Link href={`/builder/${r.id}`} className="block hover:opacity-90" aria-label={`Open ${displayTitle(r)}`}>
                <div className="aspect-[3/4] bg-app-bg rounded-sm mb-3 p-2 overflow-hidden">
                  <TemplateThumbnail id={r.template} data={r.data} />
                </div>
              </Link>
              <div className="flex items-center justify-between gap-2">
                <Link href={`/builder/${r.id}`} className="font-medium text-sm truncate hover:text-seal">
                  {displayTitle(r)}
                </Link>
                <span
                  title="Resume score"
                  className="text-xs font-mono bg-seal-soft text-seal-deep px-1.5 py-0.5 rounded-sm shrink-0"
                >
                  {r.score}
                </span>
              </div>
              <div className="flex items-center justify-between mt-1 gap-2">
                <p className="text-xs text-ink-soft truncate">
                  Updated {formatDate(r.updated_at)} · {r.template[0].toUpperCase() + r.template.slice(1)}
                </p>
                <button
                  onClick={() => duplicate(r)}
                  disabled={busyId === r.id}
                  className="text-xs text-ink-soft hover:text-seal shrink-0 disabled:opacity-60"
                >
                  {busyId === r.id ? "Copying…" : "Duplicate"}
                </button>
              </div>
            </div>
          ))}
          {!atResumeLimit && !query && (
            <div className="border-2 border-dashed border-rule rounded-sm aspect-[3/4] flex items-center justify-center">
              <NewResumeButton label="+ Create New" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
