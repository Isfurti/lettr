"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ResumeExample, ExampleCategory } from "@/lib/examples";
import { LazyResumeShot } from "@/components/examples/LazyResumeShot";

/** Filterable grid of example resumes. */
export function ExamplesGallery({ examples, categories }: { examples: ResumeExample[]; categories: ExampleCategory[] }) {
  const [cat, setCat] = useState<ExampleCategory | "All">("All");
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return examples.filter(
      (e) =>
        (cat === "All" || e.category === cat) &&
        (!term || e.title.toLowerCase().includes(term) || e.resume.skills.some((s) => s.toLowerCase().includes(term)))
    );
  }, [examples, cat, q]);

  return (
    <div>
      <div className="flex flex-col gap-4 mb-8">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search a job, e.g. nurse, accountant, React"
          aria-label="Search examples"
          className="field-input max-w-md"
        />
        <div role="tablist" aria-label="Category" className="flex flex-wrap gap-2">
          {(["All", ...categories] as const).map((c) => {
            const on = c === cat;
            return (
              <button
                key={c}
                role="tab"
                aria-selected={on}
                onClick={() => setCat(c)}
                className={`min-h-11 px-4 rounded-full border-2 text-sm font-bold transition-colors ${
                  on ? "bg-ink text-white border-ink" : "bg-white text-ink border-[#D9DEEA] hover:border-ink"
                }`}
              >
                {c}
              </button>
            );
          })}
        </div>
      </div>

      {shown.length === 0 ? (
        <p className="bg-white rounded-3xl border border-rule p-8 text-center text-slate">
          No examples match that yet. Try another word, or{" "}
          <Link href="/builder/new" className="font-bold text-brand-blue hover:underline">
            start from a blank resume
          </Link>
          .
        </p>
      ) : (
        <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
          {shown.map((e) => (
            <Link key={e.slug} href={`/examples/${e.slug}`} className="group flex flex-col">
              <div className="lift relative bg-white rounded-2xl border border-rule p-3 shadow-[0_10px_24px_rgba(4,22,50,0.08)]">
                <LazyResumeShot template={e.template} data={e.resume} />
                <span className="absolute -top-3 left-3 bg-gold text-ink text-xs font-extrabold px-2.5 py-1 rounded-full">{e.stage}</span>
              </div>
              <p className="mt-4 font-brand font-extrabold text-lg leading-snug group-hover:text-brand-blue transition-colors">{e.title}</p>
              <p className="text-sm text-slate">{e.category}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
