import type { ExperienceEntry } from "@/lib/types";

/** Heading above the first job of a group ("Overseas experience"). Set by applyLayout. Matches GroupHeadingPdf. */
export function GroupHeading({ exp }: { exp: ExperienceEntry }) {
  if (!exp.groupHeading) return null;
  return <p className="text-[11px] font-bold uppercase tracking-wider text-ink-soft mb-1 pt-1">{exp.groupHeading}</p>;
}
