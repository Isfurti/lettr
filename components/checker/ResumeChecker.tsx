"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import type { ResumeData } from "@/lib/types";
import type { ResumeReadReport, ReadCheckStatus } from "@/lib/ats-read";
import { sectionNameOf } from "@/lib/ats-read";
import { saveGuestDraft, loadGuestDraft, guestDraftHasContent } from "@/lib/guest-draft";
import { ScoreStamp } from "@/components/builder/BuilderChrome";

type CheckResult = {
  fileName: string;
  text: string;
  truncated: boolean;
  read: ResumeReadReport;
  data: ResumeData | null;
  score: { overall: number; tips: { section: string; tip: string }[] } | null;
};

const LINKEDIN_STEPS = [
  "Open LinkedIn and go to your profile (tap your photo, then View profile).",
  "Tap More (or Resources on a computer), then Save to PDF.",
  "Come back here and upload that PDF.",
];

const STATUS_STYLE: Record<ReadCheckStatus, { dot: string; label: string }> = {
  pass: { dot: "bg-[#1F9D55] text-white", label: "Looks good" },
  warn: { dot: "bg-gold text-ink", label: "Worth fixing" },
  fail: { dot: "bg-red-600 text-white", label: "Fix this" },
};

function StatusIcon({ status }: { status: ReadCheckStatus }) {
  return (
    <span
      aria-label={STATUS_STYLE[status].label}
      className={`shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-extrabold ${STATUS_STYLE[status].dot}`}
    >
      {status === "pass" ? "✓" : "!"}
    </span>
  );
}

/** Upload a resume (or LinkedIn PDF), see what job sites read, and get a free score - no account needed. */
export function ResumeChecker({ initialMode = "file" }: { initialMode?: "file" | "linkedin" }) {
  const router = useRouter();
  const { status: authStatus } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "linkedin">(initialMode);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [opening, setOpening] = useState(false);
  const [openError, setOpenError] = useState<string | null>(null);

  async function check(file: File) {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/check-resume", { method: "POST", body: form });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(body.error ?? "Something went wrong. Please try again.");
        return;
      }
      setResult(body as CheckResult);
      window.setTimeout(() => document.getElementById("checker-results")?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch {
      setError("We couldn't reach Lettr. Check your connection and try again.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function openInBuilder() {
    if (!result?.data) return;
    setOpenError(null);
    if (authStatus === "authenticated") {
      setOpening(true);
      const res = await fetch("/api/resumes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: result.data.contact.fullName ? `${result.data.contact.fullName}'s Resume` : "Imported Resume",
          template: "classic",
          data: result.data,
        }),
      });
      setOpening(false);
      if (res.status === 402) {
        setOpenError("Your free plan already has a resume. Upgrade to Pro for more, or edit your existing one.");
        return;
      }
      if (!res.ok) {
        setOpenError("Couldn't open it in the builder. Please try again.");
        return;
      }
      const body = await res.json();
      router.push(`/builder/${body.id}`);
      return;
    }
    saveGuestDraft({ data: result.data, template: "classic" });
    router.push("/builder/new");
  }

  const replacesDraft =
    authStatus !== "authenticated" && typeof window !== "undefined" && guestDraftHasContent(loadGuestDraft());
  const passCount = result?.read.checks.filter((c) => c.status === "pass").length ?? 0;

  return (
    <div className="flex flex-col gap-10">
      {/* Upload card */}
      <div className="bg-white border-2 border-ink rounded-[32px] shadow-[8px_8px_0_var(--ink)] p-6 sm:p-10">
        <div role="tablist" aria-label="What to upload" className="inline-flex p-1 rounded-full bg-sand mb-6">
          {(
            [
              ["file", "My resume file"],
              ["linkedin", "My LinkedIn profile"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              onClick={() => setMode(id)}
              className={`min-h-11 px-4 sm:px-5 rounded-full text-sm sm:text-[15px] font-bold transition-colors ${
                mode === id ? "bg-white text-ink shadow-[0_2px_6px_rgba(4,22,50,0.12)]" : "text-slate"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "linkedin" && (
          <ol className="mb-6 grid sm:grid-cols-3 gap-3">
            {LINKEDIN_STEPS.map((s, i) => (
              <li key={s} className="flex gap-3 items-start bg-brand-blue-soft rounded-2xl p-4">
                <span className="shrink-0 w-7 h-7 rounded-full bg-brand-blue text-white text-sm font-extrabold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="text-[15px] leading-snug">{s}</span>
              </li>
            ))}
          </ol>
        )}

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) check(f);
          }}
          className={`flex flex-col items-center justify-center text-center gap-3 rounded-3xl border-[3px] border-dashed px-6 py-10 sm:py-14 cursor-pointer transition-colors ${
            dragging ? "border-brand-blue bg-brand-blue-soft" : "border-[#C9D1E3] hover:border-brand-blue bg-cream"
          } ${busy ? "pointer-events-none opacity-70" : ""}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) check(f);
            }}
          />
          <span aria-hidden="true" className="w-14 h-14 rounded-2xl bg-brand-blue-soft flex items-center justify-center">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--brand-blue)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 16V4M6 10l6-6 6 6M4 20h16" />
            </svg>
          </span>
          {busy ? (
            <>
              <span className="font-brand font-extrabold text-xl">Reading your resume…</span>
              <span className="text-slate">This takes about 10 seconds.</span>
            </>
          ) : (
            <>
              <span className="font-brand font-extrabold text-xl">
                {mode === "linkedin" ? "Upload your LinkedIn PDF" : "Drop your resume here"}
              </span>
              <span className="text-slate">
                or <span className="font-bold text-brand-blue underline">choose a file</span> · PDF or Word, up to 5 MB
              </span>
            </>
          )}
        </label>
        <p className="mt-4 text-sm text-slate text-center">
          Free, no account needed. We don&apos;t keep your file: it&apos;s read once and thrown away.
        </p>
        {error && (
          <p role="alert" className="mt-4 bg-red-50 text-red-700 font-bold rounded-2xl px-5 py-4">
            {error}
          </p>
        )}
      </div>

      {/* Results */}
      {result && (
        <div id="checker-results" className="scroll-mt-6 flex flex-col gap-6">
          <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] gap-6">
            <div className="bg-white border-2 border-ink rounded-[28px] shadow-[6px_6px_0_var(--ink)] p-6 sm:p-8 flex flex-col gap-5">
              <div className="flex items-center gap-5">
                {result.score ? (
                  <ScoreStamp score={result.score.overall} />
                ) : (
                  <div className="w-[92px] h-[92px] rounded-full border-[3px] border-dashed border-[#A3AEC6] flex items-center justify-center text-slate font-bold text-center text-xs p-2">
                    Score not ready
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate truncate">{result.fileName}</p>
                  <h2 className="font-brand font-extrabold text-[26px] leading-tight tracking-tight">
                    {result.score
                      ? result.score.overall >= 80
                        ? "Strong resume."
                        : result.score.overall >= 50
                        ? "A solid start."
                        : "Plenty to improve."
                      : "Here's what we could read."}
                  </h2>
                  <p className="text-slate">
                    {passCount} of {result.read.checks.length} reading checks passed.
                  </p>
                </div>
              </div>

              {result.score && result.score.tips.length > 0 && (
                <div className="bg-[#FFF8E6] border-2 border-dashed border-gold-deep rounded-3xl p-5">
                  <p className="font-extrabold mb-3">Lettr&apos;s notes</p>
                  <ul className="flex flex-col gap-3">
                    {result.score.tips.slice(0, 3).map((t, i) => (
                      <li key={i} className="text-[15px] font-semibold leading-snug">
                        <span className="text-gold-deep font-extrabold">{t.section}:</span> {t.tip}
                      </li>
                    ))}
                  </ul>
                  {result.score.tips.length > 3 && (
                    <p className="mt-3 text-sm text-slate">
                      {result.score.tips.length - 3} more in the builder.
                    </p>
                  )}
                </div>
              )}
              {!result.score && (
                <p className="text-slate">
                  We read your file, but couldn&apos;t work out the sections well enough to score it. The checks on the right
                  still apply.
                </p>
              )}

              <div className="flex flex-wrap gap-3 mt-auto">
                {result.data && (
                  <button
                    onClick={openInBuilder}
                    disabled={opening}
                    className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
                  >
                    {opening ? "Opening…" : "Fix it in Lettr"}
                  </button>
                )}
                <button
                  onClick={() => inputRef.current?.click()}
                  className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-white border-2 border-ink font-bold"
                >
                  Check another file
                </button>
              </div>
              {replacesDraft && result.data && (
                <p className="text-sm text-slate -mt-2">This replaces the draft saved on this device.</p>
              )}
              {openError && (
                <p className="text-sm font-bold text-red-700">
                  {openError}{" "}
                  <Link href="/pricing" className="underline">
                    See Pro
                  </Link>
                </p>
              )}
            </div>

            <div className="bg-white border border-rule rounded-[28px] p-6 sm:p-8">
              <h2 className="font-brand font-extrabold text-2xl tracking-tight">Reading checks</h2>
              <p className="mt-1 text-slate">How easily hiring software can read your file.</p>
              <ul className="mt-5 flex flex-col gap-4">
                {result.read.checks.map((c) => (
                  <li key={c.id} className="flex gap-3 items-start">
                    <StatusIcon status={c.status} />
                    <div>
                      <p className="font-bold leading-snug">{c.label}</p>
                      <p className="text-[15px] text-slate leading-snug">{c.detail}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-ink text-white rounded-[28px] p-6 sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-brand font-extrabold text-2xl tracking-tight">What job sites see</h2>
                <p className="mt-1 text-white/70">
                  The plain text hiring software pulls from your file. Headings it recognises are in yellow.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {result.read.sectionsFound.map((s) => (
                  <span key={s} className="bg-gold text-ink text-xs font-extrabold px-2.5 py-1 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
            <pre className="mt-5 max-h-[420px] overflow-auto whitespace-pre-wrap break-words bg-white/[0.06] border border-white/15 rounded-2xl p-4 sm:p-5 text-[13px] leading-relaxed font-mono text-white/85">
              {result.text.split("\n").map((line, i) => {
                const heading = sectionNameOf(line);
                return (
                  <span key={i} className={heading ? "text-gold font-bold" : undefined}>
                    {line}
                    {"\n"}
                  </span>
                );
              })}
              {result.truncated && <span className="text-white/50">… (shortened)</span>}
            </pre>
            <p className="mt-3 text-sm text-white/60">
              If parts are missing, jumbled or out of order here, a job site sees them the same way. Tables, text boxes and
              two-column layouts are the usual cause.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
