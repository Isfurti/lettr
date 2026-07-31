"use client";

import { useRef, useState, useEffect, useCallback } from "react";

const OUTPUT_SIZE = 400; // px - final baked photo dimensions
const VIEWPORT_SIZE = 280; // px - size of the interactive preview circle on screen
const JPEG_QUALITY = 0.9;

export function PhotoAdjuster({
  imageDataUrl,
  initialZoom = 1,
  initialOffsetX = 50,
  initialOffsetY = 50,
  onApply,
  onCancel,
}: {
  imageDataUrl: string;
  initialZoom?: number;
  initialOffsetX?: number;
  initialOffsetY?: number;
  onApply: (result: { croppedDataUrl: string; zoom: number; offsetX: number; offsetY: number }) => void;
  onCancel: () => void;
}) {
  const [zoom, setZoom] = useState(initialZoom);
  const [offsetX, setOffsetX] = useState(initialOffsetX); // 0-100, percentage-based like object-position
  const [offsetY, setOffsetY] = useState(initialOffsetY);
  const dragState = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);

  function onPointerDown(e: React.PointerEvent) {
    dragState.current = { startX: e.clientX, startY: e.clientY, startOffsetX: offsetX, startOffsetY: offsetY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!dragState.current) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    // Dragging right should reveal more of the image's left side, so the
    // image (and therefore the offset driving object-position) moves
    // opposite to the pointer - this matches how every photo cropper works.
    const nextX = clamp(dragState.current.startOffsetX - (dx / VIEWPORT_SIZE) * 100, 0, 100);
    const nextY = clamp(dragState.current.startOffsetY - (dy / VIEWPORT_SIZE) * 100, 0, 100);
    setOffsetX(nextX);
    setOffsetY(nextY);
  }

  function onPointerUp(e: React.PointerEvent) {
    dragState.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  const bake = useCallback(() => {
    return new Promise<string>((resolve, reject) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Couldn't process that image."));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Couldn't process that image."));

        // Same math CSS object-fit:cover + object-position uses: scale the
        // image so it fully covers the square, then apply zoom on top, then
        // position it so the chosen offset lands in the center.
        const coverScale = Math.max(OUTPUT_SIZE / img.width, OUTPUT_SIZE / img.height) * zoom;
        const drawW = img.width * coverScale;
        const drawH = img.height * coverScale;
        const drawX = (OUTPUT_SIZE - drawW) * (offsetX / 100);
        const drawY = (OUTPUT_SIZE - drawH) * (offsetY / 100);

        ctx.drawImage(img, drawX, drawY, drawW, drawH);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = imageDataUrl;
    });
  }, [imageDataUrl, zoom, offsetX, offsetY]);

  async function handleApply() {
    const croppedDataUrl = await bake();
    onApply({ croppedDataUrl, zoom, offsetX, offsetY });
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-6">
      <div className="paper-sheet rounded-sm p-6 max-w-sm w-full">
        <h3 className="font-display font-semibold text-lg mb-1">Adjust photo</h3>
        <p className="text-xs text-ink-soft mb-4">Drag to reposition, use the slider to zoom.</p>

        <div
          className="relative mx-auto rounded-full overflow-hidden border-2 border-seal cursor-move select-none"
          style={{ width: VIEWPORT_SIZE, height: VIEWPORT_SIZE, touchAction: "none" }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageDataUrl}
            alt=""
            draggable={false}
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{
              objectFit: "cover",
              objectPosition: `${offsetX}% ${offsetY}%`,
              transform: `scale(${zoom})`,
              transformOrigin: `${offsetX}% ${offsetY}%`,
            }}
          />
        </div>

        <label className="block mt-5">
          <span className="text-xs text-ink-soft">Zoom</span>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
        </label>

        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 bg-seal text-white text-sm font-medium py-2 rounded-sm hover:opacity-90"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 border border-rule text-sm py-2 rounded-sm hover:bg-app-bg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}
