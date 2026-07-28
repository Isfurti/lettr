import type { ResumeData } from "./types";

const DRAFT_KEY = "lettr_guest_draft";

export type GuestDraft = {
  data: ResumeData;
  template: string;
  /** Set when the user clicked an export button while still anonymous, so
   * we know to auto-trigger that export right after they finish signing up. */
  pendingExport?: "pdf" | "docx";
};

export function saveGuestDraft(draft: GuestDraft) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // Storage can fail (private browsing, quota) - losing the draft is a
    // degraded experience, not a broken one, so we don't throw.
  }
}

export function loadGuestDraft(): GuestDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearGuestDraft() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DRAFT_KEY);
  } catch {
    // no-op
  }
}

/**
 * Called right after a successful signup/login when a guest was mid-export.
 * Creates the real, saved resume from their local draft, downloads the file
 * they originally asked for, then sends them to the real editor for it.
 * Returns true if it handled everything (caller should not also redirect).
 */
export async function completeGuestExport(navigate: (path: string) => void): Promise<boolean> {
  const draft = loadGuestDraft();
  if (!draft?.pendingExport) return false;

  const createRes = await fetch("/api/resumes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: "Untitled Resume", template: draft.template, data: draft.data }),
  });
  if (!createRes.ok) return false;
  const { id } = await createRes.json();

  const exportPath = draft.pendingExport === "docx" ? "/api/resumes/docx" : "/api/resumes/pdf";
  const exportRes = await fetch(exportPath, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resume: draft.data, template: draft.template }),
  });

  if (exportRes.ok) {
    const blob = await exportRes.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = draft.pendingExport === "docx" ? "docx" : "pdf";
    a.download = `${(draft.data.contact.fullName || "resume").replace(/\s+/g, "_")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }
  // If the export itself failed (e.g. free-tier limit edge case), we still
  // land them in the real editor with their saved resume rather than losing
  // their work - they can just click Export again from there.

  clearGuestDraft();
  navigate(`/builder/${id}`);
  return true;
}
