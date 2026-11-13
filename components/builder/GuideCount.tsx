import type { Guide } from "@/lib/guidance";

/** A small "43 words · aim for 30–90" line under a field. Gold when outside the range. */
export function GuideCount({ guide, className = "" }: { guide: Guide; className?: string }) {
  return (
    <p className={`text-xs mt-1 ${guide.ok ? "text-ink-soft" : "text-gold-deep font-bold"} ${className}`} aria-live="polite">
      {guide.text}
    </p>
  );
}
