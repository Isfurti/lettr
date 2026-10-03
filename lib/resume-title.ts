import type { ResumeData } from "./types";

/**
 * "Untitled Resume" says nothing when you have four of them - fall back to
 * the person's name and most recent role so each card is recognisable.
 */
export function displayTitle(r: { title: string; data: ResumeData }): string {
  const title = r.title.trim();
  if (title && title !== "Untitled Resume") return title;
  const name = r.data.contact?.fullName?.trim();
  const role = r.data.experience?.[0]?.role?.trim();
  if (name && role) return `${name} — ${role}`;
  if (name) return `${name} — Resume`;
  if (role) return `${role} resume`;
  return "Untitled Resume";
}
