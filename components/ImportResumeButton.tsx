"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function ImportResumeButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/resumes/import", { method: "POST", body: formData });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (res.status === 402) {
      router.push("/pricing");
      return;
    }
    if (!res.ok) {
      setError(body.error ?? "Couldn't import that file.");
      return;
    }
    router.push(`/builder/${body.id}`);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        className="border border-rule text-sm px-4 py-2.5 rounded-sm font-medium hover:bg-app-bg disabled:opacity-60 transition-colors"
      >
        {loading ? "Reading your resume…" : "Import existing resume"}
      </button>
      {error && <p className="text-xs text-red-600 mt-1.5 max-w-xs">{error}</p>}
    </div>
  );
}
