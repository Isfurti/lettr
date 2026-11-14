"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ResumeData } from "@/lib/types";
import type { Plan } from "@/lib/limits";
import { LETTER_TEMPLATES, letterFileName, type LetterTemplateId } from "@/lib/letter-templates";

/**
 * Pick one of ten cover letter designs, preview it with your own letter, and
 * download it as a PDF (or Word on Pro). Pro designs can be previewed on the
 * free plan but not downloaded.
 */
export function LetterDesigns({
  data,
  letter,
  company,
  plan,
}: {
  data: ResumeData;
  letter: string;
  company: string;
  plan: Plan;
}) {
  const [design, setDesign] = useState<LetterTemplateId>("classic");
  const [preview, setPreview] = useState<{ url: string; key: string } | null>(null);
  const [busy, setBusy] = useState<"preview" | "pdf" | "docx" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgrade, setUpgrade] = useState(false);
  const chosen = LETTER_TEMPLATES.find((t) => t.id === design)!;
  const locked = plan !== "pro" && !chosen.free;

  // A preview belongs to one design and one version of the letter; it hides
  // itself when either changes.
  const currentKey = `${design}|${company}|${letter}`;
  const previewUrl = preview && preview.key === currentKey ? preview.url : null;
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview.url);
    };
  }, [preview]);

  async function request(kind: "preview" | "pdf" | "docx") {
    setBusy(kind);
    setError(null);
    setUpgrade(false);
    try {
      const res = await fetch(kind === "docx" ? "/api/letters/docx" : "/api/letters/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: data, letter, design, company, inline: kind === "preview" }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? "Couldn't make the file. Please try again.");
        setUpgrade(Boolean(body.upgradeRequired));
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (kind === "preview") {
        setPreview({ url, key: currentKey });
        return;
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = letterFileName(data, kind);
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();
      // Some browsers (Safari, Firefox) start the download after click() returns.
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="bg-white border border-rule rounded-xl p-5">
      <p className="font-bold">Letter design</p>
      <p className="text-xs text-ink-soft mt-0.5 mb-3">
        Uses your name, contact details and accent colour. {plan !== "pro" && "Classic and Modern are free; the rest come with Pro."}
      </p>
      <div role="radiogroup" aria-label="Letter design" className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {LETTER_TEMPLATES.map((t) => {
          const isLocked = plan !== "pro" && !t.free;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={design === t.id}
              onClick={() => setDesign(t.id)}
              title={t.blurb}
              className={`relative rounded-lg border-2 p-1 text-left transition-colors ${
                design === t.id ? "border-brand-blue" : "border-rule hover:border-ink/40"
              }`}
            >
              <Image
                src={`/letter-designs/${t.id}.jpg`}
                alt=""
                width={447}
                height={632}
                className="w-full h-auto rounded border border-rule/60"
              />
              <span className="block text-[11px] font-bold mt-1 truncate">{t.name}</span>
              {isLocked && (
                <span className="absolute top-1.5 right-1.5 text-[9px] font-extrabold bg-ink text-gold px-1.5 py-0.5 rounded">PRO</span>
              )}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-slate mt-2">
        <span className="font-bold text-ink">{chosen.name}:</span> {chosen.blurb}. Thumbnails show a sample letter.
      </p>

      <div className="flex flex-wrap gap-2 mt-4">
        <button
          type="button"
          onClick={() => void request("preview")}
          disabled={busy !== null}
          className="inline-flex items-center min-h-11 px-4 rounded-full border-2 border-ink text-sm font-bold disabled:opacity-60"
        >
          {busy === "preview" ? "Making preview…" : "Preview with my letter"}
        </button>
        <button
          type="button"
          onClick={() => void request("pdf")}
          disabled={busy !== null || locked}
          className="btn-press inline-flex items-center min-h-11 px-4 rounded-full bg-brand-blue text-white text-sm font-bold shadow-[0_4px_0_var(--brand-blue-deep)] disabled:opacity-60"
        >
          {busy === "pdf" ? "Preparing…" : "Download PDF"}
        </button>
        <button
          type="button"
          onClick={() => void request("docx")}
          disabled={busy !== null || locked}
          className="inline-flex items-center min-h-11 px-4 rounded-full border-2 border-rule text-sm font-bold hover:border-ink disabled:opacity-60"
        >
          {busy === "docx" ? "Preparing…" : `Word${plan !== "pro" ? " (Pro)" : ""}`}
        </button>
      </div>
      {locked && (
        <p className="text-sm mt-2">
          {chosen.name} is a Pro design. You can preview it, or pick Classic or Modern to download free.{" "}
          <Link href="/pricing" className="font-bold text-brand-blue underline">
            See Pro
          </Link>
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 mt-2" role="alert">
          {error}{" "}
          {upgrade && (
            <Link href="/pricing" className="font-bold underline">
              See Pro
            </Link>
          )}
        </p>
      )}
      {previewUrl && (
        <div className="mt-4">
          <iframe src={previewUrl} title={`${chosen.name} cover letter preview`} className="w-full h-[640px] rounded-lg border border-rule bg-white" />
          <p className="text-xs text-ink-soft mt-1">
            Preview not showing?{" "}
            <a href={previewUrl} target="_blank" rel="noopener" className="font-bold text-brand-blue underline">
              Open it in a new tab
            </a>
            .
          </p>
        </div>
      )}
    </div>
  );
}
