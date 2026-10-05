import Link from "next/link";

/** The Lettr mark: a tilted "L" stamp next to the lowercase wordmark. */
export function Logo({ dark = false, href = "/" }: { dark?: boolean; href?: string }) {
  return (
    <Link
      href={href}
      aria-label="Lettr home"
      className={`inline-flex items-center gap-2.5 font-brand font-extrabold text-[26px] tracking-tight leading-none hover:opacity-90 ${
        dark ? "text-white" : "text-ink"
      }`}
    >
      <span
        aria-hidden="true"
        className={`w-9 h-9 rounded-[11px] flex items-center justify-center text-[21px] -rotate-6 ${
          dark ? "bg-gold text-ink" : "bg-ink text-gold"
        }`}
      >
        L
      </span>
      lettr
    </Link>
  );
}
