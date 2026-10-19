"use client";

import { useState } from "react";
import { UseTemplateButton } from "@/components/UseTemplateButton";
import { TemplateThumbnail } from "@/components/TemplateThumbnail";
import { TEMPLATE_SAMPLES, type TemplateSampleId } from "@/lib/sample-resume";

type GridTemplate = { id: string; name: string; description: string; tags: string[]; free: boolean };

/** The template gallery, with a switch to preview every template as an India, USA or UK resume. */
export function TemplatesGrid({
  templates,
  initialSample,
  canUseAll,
  isLoggedIn,
}: {
  templates: GridTemplate[];
  initialSample: TemplateSampleId;
  canUseAll: boolean;
  isLoggedIn: boolean;
}) {
  const [sampleId, setSampleId] = useState<TemplateSampleId>(initialSample);
  const sample = TEMPLATE_SAMPLES.find((s) => s.id === sampleId) ?? TEMPLATE_SAMPLES[0];

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 mb-10">
        <span className="text-sm font-bold text-slate">Preview as a resume for:</span>
        <div role="radiogroup" aria-label="Sample resume country" className="inline-flex gap-1 p-1 bg-white border-2 border-rule rounded-full">
          {TEMPLATE_SAMPLES.map((s) => {
            const active = s.id === sampleId;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSampleId(s.id)}
                className={`min-h-10 px-4 rounded-full text-sm font-bold ${active ? "bg-ink text-white" : "text-ink hover:bg-sand"}`}
              >
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 min-[520px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
        {templates.map((t) => (
          <div key={t.id} className="flex flex-col">
            <div className="lift relative bg-white rounded-2xl border border-rule p-3 shadow-[0_10px_24px_rgba(4,22,50,0.08)]">
              <span
                className={`absolute -top-3 left-3 z-10 text-xs font-extrabold px-2.5 py-1 rounded-full ${
                  t.free ? "bg-gold text-ink" : "bg-ink text-gold"
                }`}
              >
                {t.free ? "Free" : "Pro"}
              </span>
              <div className="aspect-[1/1.25] rounded-md overflow-hidden">
                <TemplateThumbnail id={t.id} data={sample.data} renderWidth={560} />
              </div>
            </div>
            <p className="mt-4 font-brand font-extrabold text-xl">{t.name}</p>
            <p className="mt-1 text-slate leading-relaxed flex-1">{t.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-3 mb-4">
              {t.tags.map((tag) => (
                <span key={tag} className="text-xs font-bold bg-brand-blue-soft text-brand-blue-deep px-2.5 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
            <UseTemplateButton
              template={t.id}
              label={t.free || canUseAll ? "Use this template" : "Try this template"}
              isLoggedIn={isLoggedIn}
              locked={isLoggedIn && !canUseAll && !t.free}
            />
          </div>
        ))}
      </div>
    </>
  );
}
