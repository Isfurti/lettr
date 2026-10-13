"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

const MAX_BYTES = 10 * 1024 * 1024;

export function ImportResumeButton() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    const ext = file.name.match(/\.([a-z0-9]+)$/i)?.[1]?.toLowerCase();
    if (ext === "doc") {
      setError("Old .doc files can't be read. Save it as .docx or PDF in Word, then try again.");
      return;
    }
    if (ext && !["pdf", "docx", "txt"].includes(ext)) {
      setError("Please choose a PDF, Word (.docx) or text file.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That file is over 10 MB. Try a smaller PDF or a Word file.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resumes/import", { method: "POST", body: formData });
      const body = await res.json().catch(() => ({}));

      if (res.status === 402) {
        router.push("/pricing");
        return;
      }
      if (!res.ok || !body.id) {
        setError(body.error ?? "Couldn't import that file. Try another file, or start from scratch.");
        setLoading(false);
        return;
      }
      router.push(`/builder/${body.id}`);
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Clear it, so picking the same file again (after an error) still works.
          e.target.value = "";
          if (file) void handleFile(file);
        }}
      />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        aria-busy={loading}
        className="btn-press inline-flex items-center justify-center gap-2 min-h-11 px-5 rounded-full bg-white border-2 border-ink text-ink text-[15px] font-bold disabled:opacity-60"
      >
        {loading ? "Reading your resume…" : "Import existing resume"}
      </button>
      {error && (
        <p role="alert" className="text-xs text-red-600 mt-1.5 max-w-xs">
          {error}
        </p>
      )}
    </div>
  );
}
