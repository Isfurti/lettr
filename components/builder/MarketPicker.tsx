"use client";

import type { ResumeData } from "@/lib/types";
import { MARKET_IDS, MARKETS, marketOf } from "@/lib/market";

/**
 * "Applying in": picks the job market. The AI suggestions, ATS tips and the
 * default page size all follow it. Shared by the editor and the Design panel.
 */
export function MarketPicker({
  data,
  setData,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const current = marketOf(data.customization);

  function choose(id: (typeof MARKET_IDS)[number] | null) {
    setData((d) => ({
      ...d,
      customization: {
        ...d.customization,
        market: id ?? undefined,
        // Each market has a normal paper size; the person can still change it.
        ...(id ? { pageSize: MARKETS[id].pageSize } : {}),
      },
    }));
  }

  const chip = (on: boolean) =>
    `inline-flex items-center justify-center min-h-10 text-sm font-bold px-4 rounded-full border-2 ${
      on ? "border-ink bg-ink text-white" : "border-rule bg-white hover:border-ink"
    }`;

  return (
    <section aria-label="Where you are applying">
      <p className="text-xs font-bold uppercase tracking-wide text-slate mb-2">Applying in</p>
      <div className="flex flex-wrap gap-2">
        {MARKET_IDS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => choose(current === id ? null : id)}
            aria-pressed={current === id}
            title={MARKETS[id].hint}
            className={chip(current === id)}
          >
            {MARKETS[id].label}
          </button>
        ))}
      </div>
      <p className="text-xs text-slate mt-2">
        {current
          ? `AI suggestions, ATS tips and page size now follow ${MARKETS[current].label} norms.`
          : "Pick a country and the AI and ATS tips will follow its resume norms."}
      </p>
    </section>
  );
}
