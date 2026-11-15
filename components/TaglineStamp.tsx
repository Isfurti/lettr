import { TAGLINE } from "@/lib/tagline";

/**
 * The tagline as a tilted stamp, so it stands out. "navy" for light pages,
 * "gold" on navy panels.
 */
export function TaglineStamp({ tone = "navy", className = "" }: { tone?: "navy" | "gold"; className?: string }) {
  const colours = tone === "navy" ? "bg-ink text-gold" : "bg-gold text-ink";
  return (
    <p
      className={`inline-block -rotate-[1.5deg] ${colours} font-brand font-extrabold text-xl sm:text-2xl px-5 py-2.5 rounded-xl shadow-[0_4px_0_var(--gold-deep)] ${className}`}
    >
      {TAGLINE}
    </p>
  );
}
