"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { EditForm, ScorePanel, JobMatchPanel, ResumePreview } from "@/components/ResumeEditor";
import { emptyResume, type ResumeData } from "@/lib/types";
import { saveGuestDraft, loadGuestDraft } from "@/lib/guest-draft";

import { TEMPLATE_IDS } from "@/lib/templates";
const TEMPLATES: readonly string[] = TEMPLATE_IDS;

export function GuestResumeEditor({ initialTemplate }: { initialTemplate: string }) {
  const [title, setTitle] = useState("Untitled Resume");
  const [template, setTemplate] = useState(initialTemplate);
  const [data, setData] = useState<ResumeData>(emptyResume);
  const [tab, setTab] = useState<"edit" | "score" | "match">("edit");
  const [showExportGate, setShowExportGate] = useState<"pdf" | "docx" | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore any in-progress draft (e.g. they left, came back, or bounced off
  // the login page and returned) rather than silently losing their work.
  useEffect(() => {
    const draft = loadGuestDraft();
    if (draft) {
      setData(draft.data);
      setTemplate(draft.template);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-save to the browser's local storage as they type - there's no
  // account yet to save this to on our server, so this is the only place
  // their work exists until they sign in.
  useEffect(() => {
    if (!hydrated) return;
    saveGuestDraft({ data, template });
  }, [data, template, hydrated]);

  function requestExport(format: "pdf" | "docx") {
    saveGuestDraft({ data, template, pendingExport: format });
    setShowExportGate(format);
  }

  return (
    <div className="flex-1 flex flex-col bg-paper">
      <PublicNav />

      <div className="border-b border-rule px-6 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="font-display font-semibold text-lg bg-transparent focus:outline-none border-b border-transparent focus:border-rule min-w-0"
          />
          <span className="text-xs text-ink-soft font-mono shrink-0">Draft saved on this device</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <select
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            className="text-sm border border-rule rounded-sm px-2 py-1.5 bg-paper-raised"
          >
            {TEMPLATES.map((t) => (
              <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={() => requestExport("pdf")}
            className="text-sm bg-seal text-white rounded-sm px-3 py-1.5 hover:opacity-90"
          >
            Export PDF
          </button>
          <button
            onClick={() => requestExport("docx")}
            className="text-sm border border-rule rounded-sm px-3 py-1.5 hover:bg-paper-raised"
          >
            Export DOCX
          </button>
        </div>
      </div>

      <div className="border-b border-rule px-6 flex gap-1">
        {[
          { id: "edit", label: "Edit" },
          { id: "score", label: "Score" },
          { id: "match", label: "Job Match" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as typeof tab)}
            className={`px-4 py-2.5 text-sm border-b-2 -mb-px ${
              tab === t.id ? "border-seal text-ink font-medium" : "border-transparent text-ink-soft"
            }`}
          >
            {t.label}
          </button>
        ))}
        <div className="px-4 py-2.5 text-sm text-ink-soft flex items-center gap-1.5">
          <span>AI features</span>
          <Link href="/signup" className="text-seal hover:underline">sign in to unlock →</Link>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-2 min-h-0">
        <div className="overflow-y-auto p-6 border-r border-rule">
          {tab === "edit" && <EditForm data={data} setData={setData} />}
          {tab === "score" && <ScorePanel data={data} plan="free" />}
          {tab === "match" && <JobMatchPanel data={data} />}
        </div>
        <div className="overflow-y-auto p-6 bg-rule/10 relative">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center overflow-hidden">
              <span className="text-4xl font-display font-bold text-ink/10 -rotate-[30deg] whitespace-nowrap select-none">
                SIGN IN TO DOWNLOAD — LETTR
              </span>
            </div>
            <ResumePreview data={data} template={template} />
          </div>
        </div>
      </div>

      {showExportGate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-6">
          <div className="paper-sheet rounded-sm p-8 max-w-sm w-full text-center">
            <h2 className="font-display font-semibold text-xl mb-2">One more step</h2>
            <p className="text-sm text-ink-soft mb-6">
              Sign in to download your resume — free, takes 10 seconds, and removes the watermark.
              Your work is already saved.
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
