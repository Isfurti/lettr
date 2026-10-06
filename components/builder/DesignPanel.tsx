"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { ResumeCustomization, ResumeData } from "@/lib/types";
import type { Plan } from "@/lib/limits";
import { ACCENT_COLORS, DEFAULT_ACCENT_COLOR, FONT_PAIRS } from "@/lib/customization";
import { TEMPLATE_IDS, isTemplateFree } from "@/lib/templates";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import {
  DATE_STYLES,
  LAYOUT_KEYS,
  SECTION_LABELS,
  SPACING_PRESETS,
  hiddenSections,
  layoutScale,
  moveSection,
  pageSize,
  photoShape,
  sectionOrder,
  type SectionKey,
} from "@/lib/layout";
import { PhotoUpload } from "@/components/PhotoUpload";
import { TemplateThumbnail } from "@/components/TemplateThumbnail";

const chip = (on: boolean) =>
  `inline-flex items-center justify-center min-h-10 text-sm font-bold px-4 rounded-full border-2 ${
    on ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"
  }`;

const label = "text-xs font-bold uppercase tracking-wide text-slate mb-2";

/**
 * The builder's "Design" panel: template, colour, fonts, page size and
 * spacing (with "Fit to one page"), section order and visibility, date
 * style, photo and photo shape. Shared by the signed-in and guest builders.
 */
export function DesignPanel({
  data,
  setData,
  template,
  setTemplate,
  plan,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
  /** Leave out to hide the template picker. */
  template?: string;
  setTemplate?: (t: string) => void;
  /** Undefined for guests (not signed in). */
  plan?: Plan;
}) {
  const [open, setOpen] = useState(false);
  const [fit, setFit] = useState<{ busy: boolean; note: string | null }>({ busy: false, note: null });
  const c = data.customization ?? {};
  const isPro = plan === "pro";

  const set = (patch: Partial<ResumeCustomization>) =>
    setData((d) => ({ ...d, customization: { ...d.customization, ...patch } }));

  const order = sectionOrder(c);
  const hidden = hiddenSections(c);
  const scale = layoutScale(c);
  const accent = c.accentColor || DEFAULT_ACCENT_COLOR;
  const isPresetColour = ACCENT_COLORS.some((x) => x.hex.toLowerCase() === accent.toLowerCase());

  // Thumbnails show the sample resume in the user's colour and fonts.
  const thumbData = useMemo<ResumeData>(
    () => ({ ...SAMPLE_RESUME, customization: { accentColor: c.accentColor, fontChoice: c.fontChoice } }),
    [c.accentColor, c.fontChoice]
  );

  async function fitToOnePage() {
    setFit({ busy: true, note: null });
    try {
      const res = await fetch("/api/resumes/fit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume: data, template: template ?? "classic" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFit({ busy: false, note: body.error ?? "Couldn't measure your resume. Try again." });
        return;
      }
      if (body.scale === null) {
        setFit({
          busy: false,
          note: "Too long for one page even at the smallest size. Try hiding a section below or trimming a few bullets.",
        });
        return;
      }
      set({ scale: body.scale });
      setFit({
        busy: false,
        note:
          body.scale >= 1
            ? body.pages > 1
              ? "Fits on one page at normal size."
              : "Already fits on one page."
            : `Fits on one page at ${Math.round(body.scale * 100)}% size.`,
      });
    } catch {
      setFit({ busy: false, note: "Couldn't reach the server. Try again." });
    }
  }

  function resetLayout() {
    setData((d) => {
      const next = { ...d.customization };
      for (const k of LAYOUT_KEYS) delete next[k];
      return { ...d, customization: next };
    });
    setFit({ busy: false, note: null });
  }

  return (
    <details
      id="section-design"
      className="group bg-white border-2 border-rule rounded-2xl px-5 py-2 open:pb-5"
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
    >
      <summary className="cursor-pointer list-none flex items-center justify-between gap-3 min-h-11 font-extrabold [&::-webkit-details-marker]:hidden">
        <span>
          Design
          <span className="block text-xs font-bold text-slate">Template, colours, fonts, page, sections</span>
        </span>
        <span className="text-sm font-bold text-brand-blue group-open:hidden">Show</span>
        <span className="text-sm font-bold text-brand-blue hidden group-open:inline">Hide</span>
      </summary>

      <div className="space-y-7 mt-5">
        {template && setTemplate && (
          <section>
            <p className={label}>Template</p>
            {open && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {TEMPLATE_IDS.map((id) => {
                  const on = id === template;
                  const pro = !isTemplateFree(id) && !isPro;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setTemplate(id)}
                      aria-pressed={on}
                      aria-label={`${id} template${pro ? " (Pro)" : ""}`}
                      className={`group/t text-left rounded-xl p-1.5 border-2 ${on ? "border-brand-blue bg-brand-blue-soft" : "border-rule hover:border-ink"}`}
                    >
                      <span className="relative block aspect-[3/4] rounded-md overflow-hidden border border-rule">
                        <TemplateThumbnail id={id} data={thumbData} renderWidth={560} />
                        {pro && (
                          <span className="absolute top-1 right-1 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-ink text-gold">Pro</span>
                        )}
                      </span>
                      <span className="block mt-1 px-0.5 text-xs font-bold capitalize text-center">{id}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        <section>
          <p className={label}>Accent colour</p>
          <div className="flex flex-wrap items-center gap-2">
            {ACCENT_COLORS.map((x) => {
              const on = accent.toLowerCase() === x.hex.toLowerCase();
              return (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => set({ accentColor: x.hex })}
                  title={x.label}
                  aria-label={`Accent colour: ${x.label}`}
                  aria-pressed={on}
                  className={`w-10 h-10 rounded-full border-[3px] transition-transform ${on ? "border-ink scale-110" : "border-white hover:scale-105"} shadow-[0_0_0_1px_var(--rule)]`}
                  style={{ backgroundColor: x.hex }}
                />
              );
            })}
            {isPro ? (
              <label
                title="Any colour"
                className={`relative w-10 h-10 rounded-full border-[3px] cursor-pointer shadow-[0_0_0_1px_var(--rule)] ${!isPresetColour ? "border-ink scale-110" : "border-white"}`}
                style={{ background: !isPresetColour ? accent : "conic-gradient(#e11d48,#f59e0b,#16a34a,#0ea5e9,#7c3aed,#e11d48)" }}
              >
                <span className="sr-only">Pick any colour</span>
                <input
                  type="color"
                  value={accent}
                  onChange={(e) => set({ accentColor: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            ) : (
              <Link
                href={plan ? "/pricing" : "/signup?continue=builder"}
                className="inline-flex items-center gap-1.5 min-h-10 px-3 rounded-full border-2 border-dashed border-rule text-xs font-bold text-slate hover:border-ink"
              >
                <span aria-hidden="true" className="w-4 h-4 rounded-full" style={{ background: "conic-gradient(#e11d48,#f59e0b,#16a34a,#0ea5e9,#7c3aed,#e11d48)" }} />
                Any colour <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-ink text-gold">Pro</span>
              </Link>
            )}
          </div>
        </section>

        <section>
          <p className={label}>Font pair</p>
          <div className="flex flex-wrap gap-2">
            {FONT_PAIRS.map((f) => (
              <button key={f.id} type="button" onClick={() => set({ fontChoice: f.id })} aria-pressed={(c.fontChoice || "editorial") === f.id} className={chip((c.fontChoice || "editorial") === f.id)}>
                {f.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate mt-3">
            Tip: select words in your summary or bullets and press <b>B</b>, <i>I</i> or <u>U</u> to make them bold, italic or underlined.
          </p>
        </section>

        <section>
          <p className={label}>Page size</p>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ["A4", "A4", "India, UK, Europe, most countries"],
                ["LETTER", "US Letter", "USA and Canada"],
              ] as const
            ).map(([id, name, hint]) => (
              <button key={id} type="button" onClick={() => set({ pageSize: id })} aria-pressed={pageSize(c) === id} title={hint} className={chip(pageSize(c) === id)}>
                {name}
              </button>
            ))}
          </div>

          <p className={`${label} mt-5`}>Spacing</p>
          <div className="flex flex-wrap items-center gap-2">
            {SPACING_PRESETS.map((p) => (
              <button key={p.id} type="button" onClick={() => set({ scale: p.scale })} aria-pressed={scale === p.scale} className={chip(scale === p.scale)}>
                {p.label}
              </button>
            ))}
            <button
              type="button"
              onClick={fitToOnePage}
              disabled={fit.busy}
              className="btn-press inline-flex items-center min-h-10 px-4 rounded-full bg-brand-blue text-white text-sm font-bold shadow-[0_3px_0_var(--brand-blue-deep)] disabled:opacity-60"
            >
              {fit.busy ? "Measuring…" : "Fit to one page"}
            </button>
          </div>
          {!SPACING_PRESETS.some((p) => p.scale === scale) && (
            <p className="text-xs text-slate mt-2">Text and spacing at {Math.round(scale * 100)}%.</p>
          )}
          {fit.note && (
            <p className="text-sm text-slate mt-2" aria-live="polite">
              {fit.note}
            </p>
          )}
        </section>

        <section>
          <p className={label}>Sections</p>
          <p className="text-xs text-slate mb-2">Move sections up or down, or untick one to leave it off your resume.</p>
          <ol className="border-2 border-rule rounded-xl divide-y divide-rule">
            {order.map((key, i) => {
              const shown = !hidden.includes(key);
              return (
                <li key={key} className="flex items-center gap-2 px-3 min-h-12">
                  <label className="flex items-center gap-2.5 flex-1 min-w-0 text-sm font-bold">
                    <input
                      type="checkbox"
                      checked={shown}
                      onChange={(e) =>
                        set({ hiddenSections: e.target.checked ? hidden.filter((h) => h !== key) : [...hidden, key] })
                      }
                      className="w-4 h-4"
                    />
                    <span className={shown ? "" : "text-slate line-through"}>{SECTION_LABELS[key]}</span>
                  </label>
                  <MoveButton label={`Move ${SECTION_LABELS[key]} up`} disabled={i === 0} onClick={() => set({ sectionOrder: moveSection(order, key, -1) })}>
                    ↑
                  </MoveButton>
                  <MoveButton
                    label={`Move ${SECTION_LABELS[key]} down`}
                    disabled={i === order.length - 1}
                    onClick={() => set({ sectionOrder: moveSection(order, key as SectionKey, 1) })}
                  >
                    ↓
                  </MoveButton>
                </li>
              );
            })}
          </ol>
          <p className="text-xs text-slate mt-2">Two-column templates keep their side column; the order applies within each column.</p>
        </section>

        <section>
          <p className={label}>Dates</p>
          <div className="flex flex-wrap gap-2">
            {DATE_STYLES.map((d) => (
              <button key={d.id} type="button" onClick={() => set({ dateStyle: d.id })} aria-pressed={(c.dateStyle ?? "short") === d.id} className={chip((c.dateStyle ?? "short") === d.id)}>
                {d.label}
              </button>
            ))}
          </div>
        </section>

        <section>
          <p className={label}>Photo</p>
          <PhotoUpload
            state={{
              photoDataUrl: c.photoDataUrl,
              photoOriginalDataUrl: c.photoOriginalDataUrl,
              photoZoom: c.photoZoom,
              photoOffsetX: c.photoOffsetX,
              photoOffsetY: c.photoOffsetY,
              showPhoto: c.showPhoto,
            }}
            onChange={(next) => set(next)}
          />
          {c.photoDataUrl && (
            <div className="flex flex-wrap gap-2 mt-3">
              {(
                [
                  ["circle", "Circle"],
                  ["rounded", "Rounded"],
                  ["square", "Square"],
                ] as const
              ).map(([id, name]) => (
                <button key={id} type="button" onClick={() => set({ photoShape: id })} aria-pressed={photoShape(c) === id} className={chip(photoShape(c) === id)}>
                  {name}
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <p className={label}>Details</p>
          <div className="flex flex-wrap gap-x-6 gap-y-3">
            <label className="flex items-center gap-2 text-sm min-h-10">
              <input type="checkbox" checked={c.showDividers ?? true} onChange={(e) => set({ showDividers: e.target.checked })} className="w-4 h-4" />
              Section dividers
            </label>
            <label className="flex items-center gap-2 text-sm min-h-10">
              <input type="checkbox" checked={c.indentBullets ?? true} onChange={(e) => set({ indentBullets: e.target.checked })} className="w-4 h-4" />
              Indent bullets
            </label>
          </div>
        </section>

        <button type="button" onClick={resetLayout} className="min-h-10 text-sm font-bold text-slate underline hover:text-ink">
          Reset layout to default
        </button>
      </div>
    </details>
  );
}

function MoveButton({ label, disabled, onClick, children }: { label: string; disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="w-10 h-10 rounded-full text-lg font-bold text-ink hover:bg-sand disabled:opacity-25 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
