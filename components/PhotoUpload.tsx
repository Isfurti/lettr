"use client";

import { useRef, useState } from "react";

const MAX_DIMENSION = 400; // px - plenty for a resume-sized circular avatar
const JPEG_QUALITY = 0.85;

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

export function PhotoUpload({
  photoDataUrl,
  showPhoto,
  onChange,
}: {
  photoDataUrl?: string;
  showPhoto?: boolean;
  onChange: (photoDataUrl: string | undefined, showPhoto: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      onChange(resized, true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't process that image.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-4">
      <div className="w-16 h-16 rounded-full bg-app-bg border border-rule overflow-hidden shrink-0 flex items-center justify-center">
        {photoDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photoDataUrl} alt="Profile" className="w-full h-full object-cover" />
        ) : (
          <span className="text-ink-soft text-xs">No photo</span>
        )}
      </div>
      <div>
        <div className="flex items-center gap-2 mb-1.5">
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
            {loading ? "Processing…" : photoDataUrl ? "Replace photo" : "Upload photo"}
          </button>
          {photoDataUrl && (
            <button
              type="button"
              onClick={() => onChange(undefined, false)}
              className="text-xs text-red-600 hover:underline"
            >
              Remove
            </button>
          )}
        </div>
        {photoDataUrl && (
          <label className="flex items-center gap-2 text-xs text-ink-soft">
            <input
              type="checkbox"
              checked={showPhoto ?? true}
              onChange={(e) => onChange(photoDataUrl, e.target.checked)}
            />
            Show photo on resume
          </label>
        )}
        {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        <p className="text-[10px] text-ink-soft mt-1">
          Entirely optional - common in some countries, often discouraged for US/UK ATS-heavy applications.
        </p>
      </div>
    </div>
  );
}
