"use client";

import { useEffect, useRef, useState } from "react";
import { ResumePreview } from "@/components/ResumeEditor";
import { SAMPLE_RESUME } from "@/lib/sample-resume";

// The live preview is designed at roughly this width; we render it at full
// size and scale it down so the thumbnail is the real template, not a sketch.
const RENDER_WIDTH = 640;

export function TemplateThumbnail({ id }: { id: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / RENDER_WIDTH);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={boxRef} className="w-full h-full overflow-hidden rounded-sm bg-white relative" aria-hidden="true">
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none"
        style={{ width: RENDER_WIDTH, transform: `scale(${scale})` }}
      >
        <ResumePreview data={SAMPLE_RESUME} template={id} />
      </div>
    </div>
  );
}
