"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { ServiceItem } from "@/lib/services";

/**
 * A header dropdown of links. Opens on mouse hover, or on click and tap; closes on Escape,
 * on an outside click, or when focus leaves. `onSelect` lets a builder handle an item itself
 * (switch a tab, save first); return true to stop the normal link.
 */
export function NavMenu({
  id,
  label,
  items,
  cols = true,
  align = "left",
  buttonClassName = "inline-flex items-center gap-1 whitespace-nowrap hover:text-brand-blue transition-colors",
  onSelect,
}: {
  id: string;
  label: string;
  items: ServiceItem[];
  cols?: boolean;
  align?: "left" | "right";
  buttonClassName?: string;
  onSelect?: (item: ServiceItem) => boolean | void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btnRef.current?.focus(); } };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);
  return (
    <div
      ref={ref}
      className="relative"
      onPointerEnter={(e) => e.pointerType === "mouse" && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === "mouse" && setOpen(false)}
      onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false); }}
    >
      <button
        ref={btnRef}
        type="button"
        aria-expanded={open}
        aria-controls={`${id}-menu`}
        onClick={() => setOpen((o) => !o)}
        className={buttonClassName}
      >
        {label}
        <svg aria-hidden="true" width="12" height="12" viewBox="0 0 12 12" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M2 4.5 6 8.5 10 4.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full pt-3 z-40 ${cols ? "w-[min(460px,calc(100vw-1.5rem))]" : "w-[min(300px,calc(100vw-1.5rem))]"}`}>
          <ul id={`${id}-menu`} className={`grid ${cols ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"} gap-1 bg-white rounded-2xl border border-rule shadow-lg p-2 text-ink`}>
            {items.map((s) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className="block rounded-xl px-3 py-2.5 hover:bg-sand text-left"
                  onClick={(e) => { if (onSelect?.(s)) e.preventDefault(); setOpen(false); }}
                >
                  <span className="block text-[15px] font-bold text-ink">{s.label}</span>
                  <span className="block text-[13px] font-medium text-ink/60 leading-snug">{s.note}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
