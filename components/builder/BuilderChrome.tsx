"use client";

import Link from "next/link";
import { scoreResumeQuality } from "@/lib/resume-score";
import type { ResumeData } from "@/lib/types";

export type BuilderTab = { id: string; label: string; pro?: boolean };

/** Pill-style tab row used by both the signed-in and the guest builder. */
export function BuilderTabs({
  tabs,
  active,
  onChange,
  showPro,
  trailing,
}: {
  tabs: BuilderTab[];
  active: string;
  onChange: (id: string) => void;
  /** Show the little "Pro" badge on Pro-only tabs (free plan and guests). */
  showPro: boolean;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="border-b border-rule bg-cream px-3 sm:px-6 py-2.5 flex items-center gap-2 overflow-x-auto whitespace-nowrap">
      <div role="tablist" aria-label="Builder sections" className="flex items-center gap-1.5">
        {tabs.map((t) => {
          const on = active === t.id;
          return (
            <button
              key={t.id}
              role="tab"
              aria-selected={on}
              onClick={() => onChange(t.id)}
              className={`inline-flex items-center gap-1.5 min-h-10 px-4 rounded-full text-sm font-bold shrink-0 transition-colors ${
                on ? "bg-ink text-white" : "text-slate hover:bg-sand"
              }`}
            >
              {t.label}
              {t.pro && showPro && (
                <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${on ? "bg-gold text-ink" : "bg-ink text-gold"}`}>
                  Pro
                </span>
              )}
            </button>
          );
        })}
      </div>
      {trailing && <div className="ml-auto pl-2 shrink-0">{trailing}</div>}
    </div>
  );
}

/** Phones can't fit the form and the preview side by side - let them flip between the two. */
export function MobileViewToggle({
  view,
  setView,
}: {
  view: "form" | "preview";
  setView: (v: "form" | "preview") => void;
}) {
  return (
    <div className="lg:hidden px-3 py-2 bg-cream border-b border-rule">
      <div className="flex p-1 rounded-full bg-sand">
        {(["form", "preview"] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            aria-pressed={view === v}
            className={`flex-1 min-h-10 rounded-full text-sm font-bold transition-colors ${
              view === v ? "bg-white text-ink shadow-[0_2px_6px_rgba(4,22,50,0.12)]" : "text-slate"
            }`}
          >
            {v === "form" ? "Write" : "Preview"}
          </button>
        ))}
      </div>
    </div>
  );
}

export type LettrNote = { key: string; label: string; tip: string };

/** Every improvement tip from the resume score, weakest section first. */
export function getLettrNotes(data: ResumeData): { overall: number; notes: LettrNote[] } {
  const result = scoreResumeQuality(data);
  const notes = [...result.sections]
    .filter((s) => s.tips.length > 0)
    .sort((a, b) => a.score - b.score)
    .flatMap((s) => s.tips.map((tip) => ({ key: s.key, label: s.label, tip })));
  return { overall: result.overall, notes };
}

/** The live score as a sticker: a dashed circle until 80, then a gold stamp. */
export function ScoreStamp({ score }: { score: number }) {
  if (score >= 80) {
    return (
      <div
        key="stamp"
        aria-label={`Resume score ${score} out of 100`}
        className="stamp-thud w-[96px] h-[96px] rounded-full bg-gold text-ink flex flex-col items-center justify-center rotate-[8deg] shadow-[0_6px_0_var(--gold-deep)]"
      >
        <span className="font-brand font-extrabold text-[34px] leading-none">{score}</span>
        <span className="text-[10px] font-extrabold mt-1">Looking strong</span>
      </div>
    );
  }
  return (
    <div
      aria-label={`Resume score ${score} out of 100`}
      className="w-[92px] h-[92px] rounded-full bg-white/90 border-[3px] border-dashed border-[#A3AEC6] text-slate flex flex-col items-center justify-center"
    >
      <span className="font-brand font-extrabold text-[30px] leading-none">{score}</span>
      <span className="text-[10px] font-bold mt-1">Stamp at 80</span>
    </div>
  );
}

/**
 * Lettr's margin notes: the score's tips, shown next to the resume with a
 * button that jumps to the section to fix. Free users and guests see the
 * single most useful tip (same as the Score tab); Pro sees all of them.
 */
export function LettrNotes({
  data,
  fullAccess,
  onGo,
  upgradeHref = "/pricing",
}: {
  data: ResumeData;
  fullAccess: boolean;
  onGo: (sectionKey: string) => void;
  upgradeHref?: string;
}) {
  const { notes } = getLettrNotes(data);
  const shown = fullAccess ? notes.slice(0, 4) : notes.slice(0, 1);
  const hidden = notes.length - shown.length;

  return (
    <aside
      aria-label="Lettr's notes"
      className="bg-[#FFF8E6] border-2 border-dashed border-gold-deep rounded-3xl p-5 flex flex-col gap-4"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="font-extrabold">Lettr&apos;s notes</p>
        {notes.length > 0 && (
          <span className="bg-ink text-gold text-xs font-extrabold px-2.5 py-1 rounded-full">
            {notes.length} {notes.length === 1 ? "tip" : "tips"}
          </span>
        )}
      </div>
      {notes.length === 0 ? (
        <p className="text-[15px] font-semibold">Nothing to fix. This resume covers the basics well.</p>
      ) : (
        shown.map((n, i) => (
          <div key={`${n.key}-${i}`} className="flex flex-col gap-2">
            <p className="text-[15px] font-semibold leading-snug">
              <span className="text-gold-deep font-extrabold">{n.label}:</span> {n.tip}
            </p>
            <button
              onClick={() => onGo(n.key)}
              className="btn-press self-start inline-flex items-center min-h-10 px-4 rounded-full bg-brand-blue text-white text-sm font-bold shadow-[0_3px_0_var(--brand-blue-deep)]"
            >
              Fix {n.label.toLowerCase()}
            </button>
          </div>
        ))
      )}
      {!fullAccess && hidden > 0 && (
        <p className="text-sm text-slate">
          {hidden} more {hidden === 1 ? "tip" : "tips"} with{" "}
          <Link href={upgradeHref} className="font-bold text-brand-blue hover:underline">
            Pro
          </Link>
          .
        </p>
      )}
    </aside>
  );
}

/** Scrolls the form to a section after switching to it (ids are set on each form Section). */
export function goToSection(key: string) {
  window.setTimeout(() => {
    document.getElementById(`section-${key}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 60);
}
