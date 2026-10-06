"use client";

import { useRef, useState } from "react";
import { toggleMark, type RichMark } from "@/lib/rich-text";

const MARKS: { mark: RichMark; label: string; title: string; className: string }[] = [
  { mark: "b", label: "B", title: "Bold (Ctrl+B)", className: "font-extrabold" },
  { mark: "i", label: "I", title: "Italic (Ctrl+I)", className: "italic font-serif" },
  { mark: "u", label: "U", title: "Underline (Ctrl+U)", className: "underline" },
];

/**
 * A textarea with Bold / Italic / Underline. Select some words and press a
 * button (or Ctrl/Cmd + B, I, U). The formatting is stored as <b>, <i> and
 * <u> around the words and shows on the resume, the PDF and the Word file.
 */
export function RichTextarea({
  value,
  onChange,
  className = "",
  ...rest
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange">) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [focused, setFocused] = useState(false);

  function apply(mark: RichMark) {
    const el = ref.current;
    if (!el) return;
    const next = toggleMark(value, el.selectionStart, el.selectionEnd, mark);
    onChange(next.value);
    // Put the selection back once React has written the new value.
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(next.start, next.end);
    });
  }

  return (
    <div className="flex-1 min-w-0">
      <div
        role="toolbar"
        aria-label="Text formatting"
        className={`flex gap-1 mb-1 transition-opacity ${focused ? "opacity-100" : "opacity-50 hover:opacity-100"}`}
      >
        {MARKS.map((m) => (
          <button
            key={m.mark}
            type="button"
            title={m.title}
            aria-label={m.title}
            // Keep the cursor and selection in the text box when clicking.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => apply(m.mark)}
            className={`w-9 h-8 rounded-lg border-2 border-rule bg-white text-sm text-ink hover:border-ink ${m.className}`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => {
          if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
          const key = e.key.toLowerCase();
          if (key === "b" || key === "i" || key === "u") {
            e.preventDefault();
            apply(key);
          }
        }}
        className={className}
        {...rest}
      />
    </div>
  );
}
