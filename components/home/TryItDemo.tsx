"use client";

import { useState } from "react";

const NOTES = [
  { id: "summary", text: "Too generic. Say what you are best at.", action: "Tighten it", pts: 5 },
  { id: "metrics", text: "This is a duty, not a result. What changed because of you?", action: "Rewrite with AI", pts: 8 },
  { id: "skills", text: "The job post asks for SQL and A/B testing. You have both.", action: "Add both", pts: 7 },
] as const;

const BASE_SCORE = 66;

function Check({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

/** Home page playground: tap Lettr's margin notes and watch the sample resume (and its score) improve. */
export function TryItDemo() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const score = NOTES.reduce((s, n) => s + (done[n.id] ? n.pts : 0), BASE_SCORE);
  const stamped = score >= 80;
  const toggle = (id: string) => setDone((d) => ({ ...d, [id]: !d[id] }));
  const hl = "bg-gold rounded px-1";
  const wavy = "underline decoration-wavy decoration-brand-blue underline-offset-4";

  return (
    <div className="bg-white border-2 border-ink rounded-[28px] shadow-[8px_8px_0_var(--ink)] flex flex-col md:flex-row overflow-hidden">
      <div className="flex-1 min-w-0 relative p-6 sm:p-10 font-serif text-ink" style={{ fontFamily: "'Source Serif 4', Georgia, serif" }}>
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6" aria-live="polite">
          {stamped ? (
            <div key="stamp" className="stamp-thud w-24 h-24 sm:w-[118px] sm:h-[118px] rounded-full bg-gold text-ink flex flex-col items-center justify-center shadow-[0_8px_0_var(--gold-deep)] font-brand rotate-[8deg]">
              <span className="font-extrabold text-3xl sm:text-[40px] leading-none">{score}</span>
              <span className="font-sans font-extrabold text-[10px] sm:text-xs mt-1">Interview ready</span>
            </div>
          ) : (
            <div key={score} className="pop-in w-24 h-24 sm:w-[112px] sm:h-[112px] rounded-full border-[3px] border-dashed border-[#A3AEC6] text-slate flex flex-col items-center justify-center font-brand">
              <span className="font-extrabold text-3xl sm:text-[34px] leading-none">{score}</span>
              <span className="font-sans font-bold text-[10px] sm:text-[11px] mt-1">Stamp at 80</span>
            </div>
          )}
        </div>
        <div className="pr-28 sm:pr-36">
          <p className="text-2xl sm:text-[32px] font-semibold leading-tight">Aisha Mehra</p>
          <p className="text-slate">Product Marketing Manager, Bengaluru</p>
        </div>
        <p className="mt-6 text-[13px] tracking-[0.1em] font-semibold text-brand-blue border-b border-[#D9DEEA] pb-1">SUMMARY</p>
        <p className="mt-2.5 text-[17px] leading-relaxed">
          {done.summary ? (
            "Product marketer who turns complex features into launches people understand."
          ) : (
            <span className={wavy}>Hardworking marketing professional looking for new opportunities.</span>
          )}
        </p>
        <p className="mt-5 text-[13px] tracking-[0.1em] font-semibold text-brand-blue border-b border-[#D9DEEA] pb-1">EXPERIENCE</p>
        <div className="mt-2.5 flex justify-between gap-3 flex-wrap text-[16.5px]">
          <span className="font-semibold">Marketing Associate, Brightline</span>
          <span className="text-ink-soft">2022 to now</span>
        </div>
        <ul className="mt-2 pl-5 list-disc text-[16.5px] leading-relaxed space-y-1.5">
          <li>
            {done.metrics ? (
              <>Ran <span className={hl}>[X]</span> email campaigns a quarter, lifting open rates by <span className={hl}>[Y]%</span>.</>
            ) : (
              <span className={wavy}>Responsible for email campaigns.</span>
            )}
          </li>
          <li>Planned the launch of two product lines with sales and design.</li>
        </ul>
        <p className="mt-5 text-[13px] tracking-[0.1em] font-semibold text-brand-blue border-b border-[#D9DEEA] pb-1">SKILLS</p>
        <p className="mt-2.5 text-[16.5px]">
          Positioning, SEO, HubSpot, launch planning
          {done.skills && <span className={hl}>, SQL, A/B testing</span>}
        </p>
        <p className="mt-6 text-xs text-ink-soft font-sans">
          Example only. Yellow parts are blanks for your real numbers: Lettr doesn&apos;t make figures up.
        </p>
      </div>

      <aside aria-label="Lettr's notes" className="md:w-[300px] shrink-0 bg-[#FFF8E6] border-t-2 md:border-t-0 md:border-l-2 border-dashed border-gold-deep p-6 sm:p-7 flex flex-col gap-6">
        <p className="font-extrabold">Lettr&apos;s notes</p>
        {NOTES.map((n) => {
          const isDone = !!done[n.id];
          return (
            <div key={n.id} className={`flex flex-col gap-2.5 transition-opacity ${isDone ? "opacity-60" : ""}`}>
              <p className={`text-[15px] font-semibold leading-snug ${isDone ? "line-through" : ""}`}>{n.text}</p>
              {isDone ? (
                <button type="button" onClick={() => toggle(n.id)} aria-label={`Undo: ${n.action}`} className="self-start inline-flex items-center gap-1.5 min-h-11 text-sm font-bold text-slate">
                  <Check className="text-brand-blue" /> Fixed
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => toggle(n.id)}
                  className="btn-press self-start inline-flex items-center gap-2 min-h-11 px-4 rounded-full bg-brand-blue text-white text-sm font-bold"
                >
                  {n.action}
                  <span className="bg-gold text-ink rounded-full px-2 py-0.5 text-xs font-extrabold">+{n.pts}</span>
                </button>
              )}
            </div>
          );
        })}
      </aside>
    </div>
  );
}
