"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EditForm, ScorePanel, ResumePreview } from "@/components/ResumeEditor";
import { AtsPanel } from "@/components/builder/AtsPanel";
import { BuilderTabs, MobileViewToggle, LettrNotes, ScoreStamp, getLettrNotes, goToSection } from "@/components/builder/BuilderChrome";
import { Logo } from "@/components/Logo";
import { emptyResume, type ResumeData } from "@/lib/types";
import { saveGuestDraft, loadGuestDraft } from "@/lib/guest-draft";

import { TEMPLATE_IDS, isTemplateFree } from "@/lib/templates";
const TEMPLATES: readonly string[] = TEMPLATE_IDS;

export function GuestResumeEditor({ initialTemplate }: { initialTemplate: string }) {
  const [template, setTemplate] = useState(initialTemplate);
  const [data, setData] = useState<ResumeData>(emptyResume);
  const [tab, setTab] = useState<"edit" | "score" | "match">("edit");
  const [showExportGate, setShowExportGate] = useState<"pdf" | "docx" | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [mobileView, setMobileView] = useState<"form" | "preview">("form");
  const [hideImportTip, setHideImportTip] = useState(false);
  const [hasPendingJd, setHasPendingJd] = useState(false);
  const [showSaveNudge, setShowSaveNudge] = useState(false);

  // Restore any in-progress draft (e.g. they left, came back, or bounced off
  // the login page and returned) rather than silently losing their work.
  useEffect(() => {
    const draft = loadGuestDraft();
    if (draft) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- the draft lives in browser storage, readable only after mount
      setData(draft.data);
      setTemplate(draft.template);
    }
    setHydrated(true);
    // Arrived from the homepage demo with a job in mind - remind them it's waiting in Job Match.
    try {
      if (window.localStorage.getItem("lettr_pending_jd")) setHasPendingJd(true);
    } catch {
      // storage unavailable
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save to the browser's local storage as they type - there's no
  // account yet to save this to on our server, so this is the only place
  // their work exists until they sign in.
  useEffect(() => {
    if (!hydrated) return;
    saveGuestDraft({ data, template });
  }, [data, template, hydrated]);

  // After a few minutes of real work, remind them the draft only lives in
  // this browser. Shown once per visit, never before they've written anything.
  const hasContent = Boolean(data.contact.fullName || data.summary || data.experience.length);
  useEffect(() => {
    if (!hasContent) return;
    try {
      if (window.sessionStorage.getItem("lettr_save_nudge")) return;
    } catch {
      // storage blocked - just show it
    }
    const t = window.setTimeout(() => setShowSaveNudge(true), 3 * 60 * 1000);
    return () => window.clearTimeout(t);
  }, [hasContent]);

  function dismissSaveNudge() {
    setShowSaveNudge(false);
    try {
      window.sessionStorage.setItem("lettr_save_nudge", "1");
    } catch {
      // storage blocked
    }
  }

  // Escape closes the sign-in dialog, like every other dialog on the web.
  useEffect(() => {
    if (!showExportGate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowExportGate(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showExportGate]);

  function requestExport(format: "pdf" | "docx") {
    saveGuestDraft({ data, template, pendingExport: format });
    setShowExportGate(format);
  }

  const isBlank =
    !data.contact.fullName && !data.summary && data.experience.length === 0 && data.education.length === 0;

  function goFix(sectionKey: string) {
    setTab("edit");
    setMobileView("form");
    goToSection(sectionKey);
  }
  const liveScore = getLettrNotes(data).overall;

  return (
    <div className="flex-1 flex flex-col bg-cream text-ink">
      {/* Slim builder header - the full marketing nav just competes with the work here. */}
      <header className="border-b border-rule bg-cream px-3 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Logo compact />
          <span className="hidden md:inline text-sm font-bold text-slate truncate">✓ Draft saved on this device</span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            aria-label="Template"
            title="Template (also in Design)"
            className="hidden md:block min-h-11 text-sm font-bold border-2 border-rule rounded-full px-3 bg-white max-w-[9.5rem] focus:outline-none focus:border-brand-blue"
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}{!isTemplateFree(t) ? " (Pro)" : ""}</option>
            ))}
          </select>
          <button
            onClick={() => requestExport("pdf")}
            className="btn-press inline-flex items-center min-h-11 px-4 sm:px-5 rounded-full bg-brand-blue text-white text-sm font-bold shadow-[0_4px_0_var(--brand-blue-deep)] whitespace-nowrap"
          >
            <span className="sm:hidden">Download</span>
            <span className="hidden sm:inline">Download PDF</span>
          </button>
          <Link href="/login?continue=builder" className="hidden md:inline-flex items-center min-h-11 px-3 text-sm font-bold text-slate hover:text-ink whitespace-nowrap">
            Sign in
          </Link>
        </div>
      </header>

      <BuilderTabs
        tabs={[
          { id: "edit", label: "Edit" },
          { id: "score", label: "Score" },
          { id: "match", label: "ATS score" },
        ]}
        active={tab}
        onChange={(id) => setTab(id as typeof tab)}
        showPro={false}
        trailing={
          <Link
            href="/signup?continue=builder"
            className="inline-flex items-center min-h-10 px-4 rounded-full bg-gold-soft text-ink text-sm font-bold hover:bg-gold transition-colors"
          >
            ✦ Unlock AI<span className="hidden sm:inline">&nbsp;writing: free account</span>
          </Link>
        }
      />

      <MobileViewToggle view={mobileView} setView={setMobileView} />

      <main id="main" className="flex-1 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] min-h-0">
        <h1 className="sr-only">Resume builder</h1>
        <div className={`overflow-y-auto px-4 sm:px-8 py-6 sm:py-8 ${mobileView === "preview" ? "hidden lg:block" : ""}`}>
          {showSaveNudge && (
            <div role="status" className="max-w-xl mb-6 bg-gold-soft rounded-2xl px-5 py-4 flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold">Keep your work safe</p>
                <p className="text-slate text-sm mt-1">
                  Your draft is only saved in this browser. Create a free account to keep it, open it on any device and download it.
                </p>
                <Link
                  href="/signup?continue=builder"
                  className="btn-press mt-3 inline-flex items-center min-h-11 px-5 rounded-full bg-ink text-white text-sm font-bold"
                >
                  Save my resume, free
                </Link>
              </div>
              <button onClick={dismissSaveNudge} aria-label="Dismiss" className="w-10 h-10 shrink-0 rounded-full hover:bg-gold text-slate">
                ✕
              </button>
            </div>
          )}
          {tab === "edit" && hasPendingJd && (
            <div className="max-w-xl mb-6 bg-brand-blue-soft text-brand-blue-deep rounded-2xl px-5 py-4">
              Your job description is saved. Fill in your details, then open{" "}
              <button onClick={() => setTab("match")} className="font-bold underline">ATS score</button> to see your match.
            </div>
          )}
          {tab === "edit" && isBlank && !hideImportTip && (
            <div className="max-w-xl mb-8 bg-white border-2 border-ink rounded-[24px] shadow-[5px_5px_0_var(--ink)] p-5 flex items-start justify-between gap-3">
              <div>
                <p className="font-extrabold text-lg mb-1">Already have a resume?</p>
                <p className="text-slate">
                  Upload your PDF, Word file or LinkedIn profile. Lettr reads it, scores it and fills everything in here.
                  No account needed.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href="/resume-checker"
                    className="btn-press inline-flex items-center min-h-11 px-5 rounded-full bg-brand-blue text-white text-sm font-bold shadow-[0_4px_0_var(--brand-blue-deep)]"
                  >
                    Upload my resume
                  </Link>
                  <Link
                    href="/resume-checker?from=linkedin"
                    className="btn-press inline-flex items-center min-h-11 px-5 rounded-full bg-white border-2 border-ink text-sm font-bold"
                  >
                    From LinkedIn
                  </Link>
                </div>
              </div>
              <button onClick={() => setHideImportTip(true)} aria-label="Dismiss" className="w-10 h-10 shrink-0 rounded-full hover:bg-sand text-slate">
                ✕
              </button>
            </div>
          )}
          {tab === "edit" && <EditForm data={data} setData={setData} guest template={template} setTemplate={setTemplate} />}
          {tab === "score" && <ScorePanel data={data} plan="free" />}
          {tab === "match" && <AtsPanel data={data} template={template} guest onFix={goFix} />}
        </div>
        <div
          className={`bg-sand border-l border-rule px-4 sm:px-8 py-6 sm:py-8 lg:sticky lg:top-0 lg:self-start lg:h-screen lg:overflow-y-auto ${
            mobileView === "form" ? "hidden lg:block" : ""
          }`}
        >
          <div className="max-w-2xl mx-auto flex flex-col gap-6">
            {!isBlank && <LettrNotes data={data} fullAccess={false} onGo={goFix} />}
            <div className="relative">
              {!isBlank && (
                <div className="absolute -top-4 -right-2 sm:-right-4 z-10">
                  <ScoreStamp score={liveScore} />
                </div>
              )}
              {/* Light, out-of-the-way watermark: marks this as a preview without covering the content. */}
              {/* Decorative watermark, drawn with CSS so it isn't read as page text. */}
              <span
                aria-hidden="true"
                data-mark="Preview · Lettr"
                className="pointer-events-none select-none absolute bottom-3 right-4 z-10 text-[11px] font-bold uppercase tracking-widest text-ink/25 before:content-[attr(data-mark)]"
              />
              <ResumePreview data={data} template={template} />
            </div>
            {!isTemplateFree(template) && (
              <p className="text-sm text-slate text-center">
                {template[0].toUpperCase() + template.slice(1)} is a Pro template. Preview it freely, download it with Pro.
              </p>
            )}
            <p className="text-sm text-slate text-center">
              Preview only. Sign in (free) to download without the watermark.
            </p>
          </div>
        </div>
      </main>

      {showExportGate && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6"
          onClick={() => setShowExportGate(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-gate-title"
        >
          <div className="bg-white border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-8 max-w-sm w-full text-center relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowExportGate(null)}
              aria-label="Close"
              className="absolute top-3 right-3 w-10 h-10 rounded-full hover:bg-sand text-slate"
            >
              ✕
            </button>
            <h2 id="export-gate-title" className="font-brand font-extrabold text-2xl mb-2">One more step</h2>
            <p className="text-slate mb-6">
              Create a free account to download your resume as a PDF — takes 10 seconds. Your work is already
              saved and comes with you.
              {!isTemplateFree(template) && " (You're using a Pro template, so the download will use Classic unless you upgrade.)"}
            </p>
            <div className="space-y-2">
              <Link
                href="/signup?continue=export"
                className="btn-press flex items-center justify-center w-full min-h-12 rounded-full bg-brand-blue text-white font-bold shadow-[0_4px_0_var(--brand-blue-deep)]"
              >
                Create free account
              </Link>
              <Link
                href="/login?continue=export"
                className="btn-press flex items-center justify-center w-full min-h-12 rounded-full border-2 border-ink font-bold"
              >
                I already have an account
              </Link>
              <button
                onClick={() => setShowExportGate(null)}
                className="min-h-11 text-sm font-bold text-slate hover:text-ink mt-2"
              >
                Keep editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
