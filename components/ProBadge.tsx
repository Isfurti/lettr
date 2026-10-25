import { Crown } from "lucide-react";

/**
 * The gold "PRO" pill shown wherever a signed-in person with active Pro sees
 * their account. Pages only render it while plan === "pro"; a paid pass that
 * has run out is switched back to Free when the user is loaded (lib/db.ts),
 * so the badge disappears on its own when Pro ends.
 */
export function ProBadge({ size = "sm", className = "" }: { size?: "sm" | "md"; className?: string }) {
  const sizing = size === "md" ? "h-7 px-2.5 text-[13px] gap-1.5" : "h-6 px-2 text-[11px] gap-1";
  return (
    <span
      className={`inline-flex items-center shrink-0 rounded-full bg-gold text-ink font-extrabold tracking-[0.08em] leading-none ${sizing} ${className}`}
      title="Lettr Pro"
    >
      <Crown aria-hidden="true" className={size === "md" ? "w-3.5 h-3.5" : "w-3 h-3"} strokeWidth={2.5} />
      PRO
    </span>
  );
}
