"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EditForm, ScorePanel, JobMatchPanel, ResumePreview, MobileViewToggle } from "@/components/ResumeEditor";
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

  // Restore any in-progress draft (e.g. they left, came back, or bounced off
  // the login page and returned) rather than silently losing their work.
  useEffect(() => {
    const draft = loadGuestDraft();
    if (draft) {
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

  return (
    <div className="flex-1 flex flex-col bg-paper">
      {/* Slim builder header - the full marketing nav just competes with the work here. */}
      <header className="border-b border-rule bg-paper px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/" className="font-display font-semibold text-xl hover:opacity-80 shrink-0">
            Lettr
          </Link>
          <span className="hidden sm:inline text-xs text-ink-soft truncate">✓ Draft auto-saved on this device</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            aria-label="Template"
            className="text-sm border border-rule rounded-sm px-2 py-1.5 bg-paper-raised max-w-[9.5rem]"
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}{!isTemplateFree(t) ? " (Pro)" : ""}</option>
            ))}
          </select>
          <button
            onClick={() => requestExport("pdf")}
            className="text-sm bg-seal text-white rounded-sm px-3 py-1.5 hover:opacity-90 whitespace-nowrap"
          >
            Download PDF
          </button>
          <Link href="/login?continue=builder" className="hidden md:inline text-sm text-ink-soft hover:text-ink whitespace-nowrap">
            Sign in
          </Link>
        </div>
      </header>

      <div className="border-b border-rule px-2 sm:px-6 flex items-center gap-1 overflow-x-auto whitespace-nowrap">
        {[
          { id: "edit", label: "Edit" },
          { id: "score", label: "Score" },
          { id: "match", label: "Job Match" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-3 sm:px-4 py-2.5 text-sm border-b-2 -mb-px shrink-0 ${
              tab === t.id ? "border-seal text-ink font-medium" : "border-transparent text-ink-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
        <Link
          href="/signup?continue=builder"
          className="ml-auto px-3 py-2.5 text-xs sm:text-sm text-seal hover:underline shrink-0"
        >
          ✦ Unlock AI<span className="hidden sm:inline"> writing — free account</span> →
        </Link>
      </div>

      <MobileViewToggle view={mobileView} setView={setMobileView} />

      <div className="flex-1 grid lg:grid-cols-2 min-h-0">
        <div className={`overflow-y-auto p-4 sm:p-6 lg:border-r border-rule ${mobileView === "preview" ? "hidden lg:block" : ""}`}>
          {tab === "edit" && hasPendingJd && (
            <div className="max-w-xl mb-4 bg-seal-soft text-seal-deep text-sm rounded-sm px-4 py-3">
              Your job description is saved. Fill in your details, then open{" "}
              <button onClick={() => setTab("match")} className="font-medium underline">Job Match</button> to see your score.
            </div>
          )}
          {tab === "edit" && isBlank && !hideImportTip && (
            <div className="max-w-xl mb-6 paper-sheet rounded-sm p-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium mb-0.5">Already have a resume?</p>
                <p className="text-xs text-ink-soft">
                  Import your PDF or Word file and Lettr fills everything in for you — needs a free account.{" "}
                  <Link href="/signup?continue=import" className="text-seal font-medium hover:underline">
                    Import my resume →
                  </Link>
                </p>
              </div>
              <button onClick={() => setHideImportTip(true)} aria-label="Dismiss" className="text-ink-soft hover:text-ink text-sm">
                ✕
              </button>
            </div>
          )}
          {tab === "edit" && <EditForm data={data} setData={setData} guest />}
          {tab === "score" && <ScorePanel data={data} plan="free" />}
          {tab === "match" && <JobMatchPanel data={data} />}
        </div>
        <div className={`overflow-y-auto p-4 sm:p-6 bg-rule/10 relative lg:sticky lg:top-0 lg:self-start lg:max-h-screen ${mobileView === "form" ? "hidden lg:block" : ""}`}>
          <div className="relative max-w-2xl mx-auto">
            {/* Light, out-of-the-way watermark: marks this as a preview without covering the content. */}
            <span className="pointer-events-none select-none absolute bottom-3 right-4 z-10 text-[11px] font-mono uppercase tracking-widest text-ink/25">
              Preview · Lettr
            </span>
            <ResumePreview data={data} template={template} />
          </div>
          {!isTemplateFree(template) && (
            <p className="max-w-2xl mx-auto mt-3 text-xs text-ink-soft text-center">
              {template[0].toUpperCase() + template.slice(1)} is a Pro template — preview it freely, download it with Pro.
            </p>
          )}
          <p className="max-w-2xl mx-auto mt-3 text-xs text-ink-soft text-center">
            Preview only — sign in (free) to download without the watermark.
          </p>
        </div>
      </div>

      {showExportGate && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6"
          onClick={() => setShowExportGate(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="export-gate-title"
        >
          <div className="paper-sheet rounded-sm p-8 max-w-sm w-full text-center relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowExportGate(null)}
              aria-label="Close"
              className="absolute top-3 right-3 text-ink-soft hover:text-ink"
            >
              ✕
            </button>
            <h2 id="export-gate-title" className="font-display font-semibold text-xl mb-2">One more step</h2>
            <p className="text-sm text-ink-soft mb-6">
              Create a free account to download your resume as a PDF — takes 10 seconds. Your work is already
              saved and comes with you.
              {!isTemplateFree(template) && " (You're using a Pro template, so the download will use Classic unless you upgrade.)"}
            </p>
            <div className="space-y-2">
              <Link
                href="/signup?continue=export"
                className="block w-full bg-ink text-white py-2.5 rounded-sm font-medium hover:opacity-90"
              >
                Create free account
              </Link>
              <Link
                href="/login?continue=export"
                className="block w-full border border-rule py-2.5 rounded-sm font-medium hover:bg-app-bg"
              >
                I already have an account
              </Link>
              <button
                onClick={() => setShowExportGate(null)}
                className="text-sm text-ink-soft hover:text-ink mt-2"
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
