"use client";

import type { ResumeData } from "@/lib/types";
import { marketOf } from "@/lib/market";
import { joinLanguage, LANGUAGE_LEVELS, splitLanguage } from "@/lib/contact";

const CEFR = /^(A1|A2|B1|B2|C1|C2|Native)$/i;

/**
 * A level picker (A1–C2, Native) for each language, shown when the resume is
 * aimed at Europe, where employers expect these levels, or when a level is
 * already set. Saved inside the language text, e.g. "German (B2)".
 */
export function LanguageLevels({
  data,
  setData,
}: {
  data: ResumeData;
  setData: React.Dispatch<React.SetStateAction<ResumeData>>;
}) {
  const languages = (data.languages ?? []).filter((l) => l.trim());
  const show = marketOf(data.customization) === "EU" || languages.some((l) => CEFR.test(splitLanguage(l).level));
  if (!show || languages.length === 0) return null;

  function setLevel(index: number, level: string) {
    setData((d) => {
      const list = [...(d.languages ?? [])].filter((l) => l.trim());
      const { name } = splitLanguage(list[index]);
      list[index] = joinLanguage(name, level);
      return { ...d, languages: list };
    });
  }

  return (
    <div className="mt-3">
      <p className="text-xs text-ink-soft mb-2">
        Level for each language. A1 is beginner, C2 is near-native. European employers often look for these.
      </p>
      <ul className="space-y-2">
        {languages.map((entry, i) => {
          const { name, level } = splitLanguage(entry);
          const known = LANGUAGE_LEVELS.find((l) => l.toLowerCase() === level.toLowerCase());
          return (
            <li key={`${name}-${i}`} className="flex items-center justify-between gap-3">
              <span className="font-bold text-sm min-w-0 truncate">{name}</span>
              <select
                value={known ?? ""}
                onChange={(e) => setLevel(i, e.target.value)}
                aria-label={`Level for ${name}`}
                className="min-h-10 border-2 border-rule rounded-xl px-2 text-sm bg-white focus:outline-none focus:border-brand-blue"
              >
                <option value="">{level && !known ? level : "No level"}</option>
                {LANGUAGE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
