"use client";

import { useRef, useState } from "react";
import { PhotoAdjuster } from "@/components/PhotoAdjuster";

const MAX_DIMENSION = 800; // px - the "original" kept for re-cropping later; larger than the final baked output
const JPEG_QUALITY = 0.9;

function resizeImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read that file."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("That doesn't look like a valid image."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Couldn't process that image."));
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export type PhotoState = {
  photoDataUrl?: string;
  photoOriginalDataUrl?: string;
  photoZoom?: number;
  photoOffsetX?: number;
  photoOffsetY?: number;
  showPhoto?: boolean;
};

export function PhotoUpload({
  state,
  onChange,
}: {
  state: PhotoState;
  onChange: (next: PhotoState) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [adjusting, setAdjusting] = useState(false);

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("That image is too large (max 10MB).");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const resized = await resizeImageFile(file);
      // Store as the working "original" and immediately open the adjuster
      // on it, starting from a centered, unzoomed crop - rather than
      // silently auto-cropping with no way to fix a bad result.
      onChange({ ...state, photoOriginalDataUrl: resized, photoZoom: 1, photoOffsetX: 50, photoOffsetY: 50 });
      setAdjusting(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't process that image.");
    } finally {
      setLoading(false);
      // Reset so selecting the SAME file again still fires onChange -
      // browsers otherwise silently no-op a repeat selection of an
      // unchanged file input value.
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function applyAdjustment(result: { croppedDataUrl: string; zoom: number; offsetX: number; offsetY: number }) {
    onChange({
      ...state,
      photoDataUrl: result.croppedDataUrl,
      photoZoom: result.zoom,
      photoOffsetX: result.offsetX,
      photoOffsetY: result.offsetY,
      showPhoto: true,
    });
    setAdjusting(false);
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-app-bg border border-rule overflow-hidden shrink-0 flex items-center justify-center">
        {state.photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={state.photoDataUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-ink-soft text-xs">No photo</span>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="text-xs border border-rule rounded-sm px-3 py-1.5 hover:bg-app-bg disabled:opacity-60"
          >
            {loading ? "Processing…" : state.photoDataUrl ? "Replace photo" : "Upload photo"}
          </button>
          {state.photoOriginalDataUrl && (
            <button
              type="button"
              onClick={() => setAdjusting(true)}
              className="text-xs border border-rule rounded-sm px-3 py-1.5 hover:bg-app-bg"
            >
              Adjust
            </button>
          )}
          {state.photoDataUrl && (
            <button
              type="button"
              onClick={() => onChange({ photoDataUrl: undefined, photoOriginalDataUrl: undefined, showPhoto: false })}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
        {state.photoDataUrl && (
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={state.showPhoto ?? true}
              onChange={(e) => onChange({ ...state, showPhoto: e.target.checked })}
            />
            Show photo on resume
          </label>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        <p className="text-[10px] text-ink-soft mt-1">
          Entirely optional - common in some countries, often discouraged for US/UK ATS-heavy applications.
        </p>
      </div>

      {adjusting && state.photoOriginalDataUrl && (
        <PhotoAdjuster
          imageDataUrl={state.photoOriginalDataUrl}
          initialZoom={state.photoZoom ?? 1}
          initialOffsetX={state.photoOffsetX ?? 50}
          initialOffsetY={state.photoOffsetY ?? 50}
          onApply={applyAdjustment}
          onCancel={() => setAdjusting(false)}
        />
      )}
    </div>
  );
}
