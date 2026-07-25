"use client";

import { useState } from "react";
import Link from "next/link";
import { NewResumeButton } from "@/components/NewResumeButton";

type ResumeCard = {
  id: string;
  title: string;
  template: string;
  updated_at: string;
  score: number;
};

export function ResumeSearch({
  resumes,
  atResumeLimit,
}: {
  resumes: ResumeCard[];
  atResumeLimit: boolean;
}) {
  const [query, setQuery] = useState("");
  const filtered = query.trim()
    ? resumes.filter((r) => r.title.toLowerCase().includes(query.trim().toLowerCase()))
    : resumes;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 gap-4">
        <h2 className="font-display font-semibold text-xl shrink-0">My Resumes</h2>
        {resumes.length > 3 && (
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search resumes…"
            className="border border-rule rounded-sm px-3 py-1.5 text-sm bg-paper-raised focus:outline-none focus:ring-2 focus:ring-seal/40 w-56"
          />
        )}
      </div>

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
            <Link
              key={r.id}
              href={`/builder/${r.id}`}
              className="paper-sheet rounded-sm p-4 hover:-translate-y-0.5 transition-transform"
            >
              <div className="aspect-[3/4] bg-app-bg rounded-sm mb-3 p-3 flex flex-col gap-1.5 overflow-hidden">
                <div className="h-2 w-3/5 bg-ink/70 rounded-sm" />
                <div className="h-1.5 w-2/5 bg-ink-soft/40 rounded-sm mb-1" />
                {[1, 0.9, 0.7, 0.85, 0.6, 0.75].map((w, i) => (
                  <div key={i} className="h-1 bg-ink-soft/20 rounded-sm" style={{ width: `${w * 100}%` }} />
                ))}
              </div>
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm truncate">{r.title}</p>
                <span className="text-xs font-mono bg-seal-soft text-seal-deep px-1.5 py-0.5 rounded-sm shrink-0 ml-2">
                  {r.score}
                </span>
              </div>
              <p className="text-xs text-ink-soft mt-1">
                Updated {new Date(r.updated_at).toLocaleDateString()} · {r.template}
              </p>
            </Link>
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
