"use client";

import { useEffect, useRef, useState } from "react";

/** Copies the profile link. Says so in words, and tells the person if the browser refused. */
export function CopyLinkButton({ url, className }: { url: string; className?: string }) {
  const [msg, setMsg] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setMsg("Link copied");
    } catch {
      setMsg("Couldn't copy. Open Settings to copy it.");
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setMsg(""), 3000);
  }
  return (
    <>
      <button type="button" onClick={copy} className={className}>Copy link</button>
      <span role="status" aria-live="polite" className="sr-only">{msg}</span>
      {msg && <span aria-hidden="true" className="text-sm font-bold text-[#ffe9a8]">{msg}</span>}
    </>
  );
}
