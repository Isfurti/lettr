/**
 * Removes personal details from text before it's kept as an AI-improvement
 * example: emails, phone numbers, links, and the person's own name and
 * employers (which we know from their resume).
 */
export function anonymize(text: string, known: { names?: string[]; companies?: string[] } = {}): string {
  let out = text
    .replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]")
    .replace(/(?:https?:\/\/|www\.)\S+/gi, "[link]")
    .replace(/(?:\+?\d[\d\s()-]{7,}\d)/g, "[phone]");
  const swap = (list: string[] | undefined, label: string) => {
    for (const raw of list ?? []) {
      const v = raw.trim();
      if (v.length < 2) continue;
      // Whole name, then each part of a name (first/last) on its own.
      const parts = label === "[name]" ? [v, ...v.split(/\s+/).filter((p) => p.length > 2)] : [v];
      for (const p of parts) {
        out = out.replace(new RegExp(`\\b${p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"), label);
      }
    }
  };
  swap(known.companies, "[company]");
  swap(known.names, "[name]");
  return out;
}
