"use client";

import { useEffect, useRef, useState } from "react";
import { ResumePreview } from "@/components/ResumeEditor";
import { SAMPLE_RESUME } from "@/lib/sample-resume";
import type { ResumeData } from "@/lib/types";

// The live preview is designed at roughly this width; we render it at full
// size and scale it down so the thumbnail is the real template, not a sketch.
const RENDER_WIDTH = 640;

/** A scaled-down live render of a template - with sample content, or a real resume when `data` is given. */
export function TemplateThumbnail({
  id,
  data,
  renderWidth = RENDER_WIDTH,
}: {
  id: string;
  data?: ResumeData;
  /** Width the template is laid out at before scaling. Narrower = text fills more of the page. */
  renderWidth?: number;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.3);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / renderWidth);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [renderWidth]);

  return (
    <div ref={boxRef} className="w-full h-full overflow-hidden rounded-sm bg-white relative" aria-hidden="true">
      <div
        className="absolute top-0 left-0 origin-top-left pointer-events-none"
        style={{ width: renderWidth, transform: `scale(${scale})` }}
      >
        <ResumePreview data={data ?? SAMPLE_RESUME} template={id} />
      </div>
    </div>
  );
}
