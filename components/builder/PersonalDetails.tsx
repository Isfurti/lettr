"use client";

import type { ResumeData } from "@/lib/types";
import { marketOf, MARKETS } from "@/lib/market";
import { PERSONAL_FIELDS, personalFieldsFor, type PersonalField } from "@/lib/contact";

/**
 * Nationality, visa status and date of birth: offered only when the resume
 * is aimed at a market that expects them (the Gulf). If someone filled them
 * in and then switched to a market that doesn't, they stay visible with a
 * note, so they can remove them.
 */
export function PersonalDetails({
  data,
  setData,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const market = marketOf(data.customization);
  const fields = personalFieldsFor(market, data.contact);
  if (fields.length === 0) return null;
  const expected = market === "GULF";

  function update(key: PersonalField, value: string) {
    setData((d) => ({ ...d, contact: { ...d.contact, [key]: value } }));
  }

  return (
    <div className="mt-4 pt-4 border-t border-rule">
      <p className="text-sm font-bold">Personal details (optional)</p>
      <p className="text-xs text-ink-soft mt-0.5 mb-3">
        {expected
          ? "Gulf employers often like to see these near the top. Fill in only what you're happy to share."
          : `Employers in ${market ? MARKETS[market].label : "most countries"} don't expect these. Clear them unless the job post asks.`}
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {PERSONAL_FIELDS.filter((f) => fields.includes(f.key)).map((f) => (
          <label key={f.key} className="block">
            <span className="block text-sm font-bold mb-1">{f.label}</span>
            <input
              value={data.contact[f.key] ?? ""}
              onChange={(e) => update(f.key, e.target.value)}
              placeholder={f.placeholder}
              className="w-full border-2 border-rule rounded-xl px-3 min-h-11 text-[15px] bg-white placeholder:text-ink-soft/50 focus:outline-none focus:border-brand-blue"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
