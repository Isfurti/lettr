"use client";

import { useEffect, useRef, useState } from "react";
import { TemplateThumbnail } from "@/components/TemplateThumbnail";
import type { ResumeData } from "@/lib/types";

/** A resume thumbnail that only renders once it scrolls near the screen, so long galleries stay fast on phones. */
export function LazyResumeShot({ template, data }: { template: string; data: ResumeData }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="aspect-[1/1.25] rounded-md overflow-hidden bg-sand">
      {show && <TemplateThumbnail id={template} data={data} renderWidth={560} />}
    </div>
  );
}
