"use client";

import { useState } from "react";
import Link from "next/link";
import { CAREER_STAGES } from "@/lib/home-examples";
import { ResumeShot } from "@/components/home/ResumeShot";

/** "Wherever you are in your career" tabs: each stage swaps in a matching example resume and how Lettr helps. */
export function CareerStages() {
  const [active, setActive] = useState(CAREER_STAGES[0].id);
  const cur = CAREER_STAGES.find((s) => s.id === active) ?? CAREER_STAGES[0];

  return (
    <div className="flex flex-col gap-6">
      <div role="tablist" aria-label="Career stage" className="flex flex-wrap gap-2.5">
        {CAREER_STAGES.map((s) => {
          const on = s.id === active;
          return (
            <button
              key={s.id}
              role="tab"
              type="button"
              id={`tab-${s.id}`}
              aria-selected={on}
              aria-controls="stage-panel"
              onClick={() => setActive(s.id)}
              className={`min-h-12 px-4 sm:px-5 rounded-full border-2 text-[15px] font-bold transition-colors ${
                on ? "bg-ink text-white border-ink" : "bg-white text-ink border-[#D9DEEA] hover:border-ink"
              }`}
            >
              {s.tab}
            </button>
          );
        })}
      </div>

      <div
        id="stage-panel"
        role="tabpanel"
        aria-labelledby={`tab-${cur.id}`}
        className="bg-white border-2 border-ink rounded-[32px] shadow-[8px_8px_0_var(--ink)] p-6 sm:p-10 flex flex-col md:flex-row gap-8 md:gap-12 items-center"
      >
        <div key={cur.id} className="rise relative shrink-0">
          <ResumeShot template={cur.template} data={cur.resume} width="min(330px, 78vw)" />
          <span className="absolute -left-3 -top-3.5 bg-gold font-extrabold text-[13px] px-3 py-1.5 rounded-full">
            {cur.templateName} template
          </span>
        </div>
        <div key={`${cur.id}-text`} className="rise flex-1 min-w-0 flex flex-col gap-4">
          <h3 className="font-brand font-extrabold text-[28px] sm:text-[34px] leading-tight tracking-tight">{cur.headline}</h3>
          <p className="text-[17px] leading-relaxed text-slate">{cur.situation}</p>
          <p className="font-extrabold mt-1">How Lettr helps</p>
          <ul className="flex flex-col gap-3.5">
            {cur.helps.map((h) => (
              <li key={h} className="flex gap-3 items-start text-base leading-relaxed">
                <span aria-hidden="true" className="shrink-0 mt-0.5 w-6 h-6 rounded-lg bg-brand-blue-soft flex items-center justify-center">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                </span>
                {h}
              </li>
            ))}
          </ul>
          <Link
            href="/builder/new"
            className="btn-press self-start mt-2 inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)]"
          >
            {cur.cta}
          </Link>
        </div>
      </div>
    </div>
  );
}
