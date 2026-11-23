import { parseStoredResume } from "./resume-version";
import type { ExperienceEntry, EducationEntry, ProjectEntry, CertificationEntry } from "./types";
import { formatResumeDate, hiddenSections } from "./layout";
import { marketOf, type Market } from "./market";
import { splitLanguage } from "./contact";
import type { PublicProfileSource } from "./db";

/**
 * The public face of a profile. This is an allowlist: the page is built only
 * from what is listed here, never from the stored resume itself, so a field
 * that is added to resumes later can never leak onto a public page by accident.
 *
 * Never included, in any country: date of birth, the street address, the
 * original uncropped photo, custom sections (free text that may hold anything),
 * and the account email. Phone and email show only when the owner turned
 * "Show phone and email" on. The photo is served by its own route.
 */
export type PublicProfile = {
  market: Market | null;
  name: string;
  headline: string;
  place: string;
  summary: string;
  email: string;
  phone: string;
  links: { label: string; url: string }[];
  /** Optional lines, e.g. "Work authorization: ..." (never date of birth). */
  facts: { label: string; value: string }[];
  experience: { role: string; company: string; dates: string; bullets: string[] }[];
  projects: { name: string; description: string; tech: string; url: string }[];
  education: { degree: string; school: string; dates: string; grade: string }[];
  certifications: { name: string; detail: string }[];
  skills: string[];
  languages: { name: string; level: string }[];
  achievements: string[];
  hasPhoto: boolean;
  photoVersion: string;
};

const clip = (v: unknown, max: number): string => (typeof v === "string" ? v.trim().slice(0, max) : "");
/** Odd saved data (a newer shape, a hand-edited row) must never crash the public page. */
const rows = <T,>(v: unknown, max: number): T[] =>
  Array.isArray(v) ? (v.filter((x) => x && typeof x === "object" && !Array.isArray(x)) as T[]).slice(0, max) : [];
const list = (v: unknown, max: number, each: number): string[] =>
  Array.isArray(v) ? v.map((x) => clip(x, each)).filter(Boolean).slice(0, max) : [];

/** Only web addresses are kept, so a link can never be a script or a file. */
export function safeHttpUrl(v: unknown): string {
  const raw = clip(v, 300);
  if (!raw) return "";
  const withScheme = /^https?:\/\//i.test(raw) ? raw : /^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(raw) ? `https://${raw}` : "";
  if (!withScheme) return "";
  try {
    const u = new URL(withScheme);
    if (u.username || u.password) return "";
    return u.protocol === "https:" || u.protocol === "http:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/**
 * "Pune, India" from a free-text location. Parts holding digits (house numbers,
 * pin codes) or street words are dropped, and only the last two remaining parts are kept, so a
 * full street address never reaches a public page.
 */
const STREET_WORD = /\b(road|rd|street|st|lane|ln|marg|nagar|sector|flat|apt|apartment|house|plot|block|colony|avenue|ave|floor|tower|society)\b/i;

export function cityOf(location: unknown): string {
  const parts = clip(location, 200)
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p && !/\d/.test(p) && !STREET_WORD.test(p));
  return parts.slice(-2).join(", ").slice(0, 80);
}

const VISA_LABEL: Record<Market, string> = {
  IN: "Visa status",
  US: "Work authorization",
  UK: "Right to work",
  EU: "Work permission",
  GULF: "Visa status",
};

/** The projection. Pure: same input, same output, no database. */
export function buildPublicProfile(src: PublicProfileSource): PublicProfile {
  const data = parseStoredResume(src.data);
  const c = data.customization;
  const market = marketOf(c);
  const hidden = new Set(hiddenSections(c));
  const style = c?.dateStyle; // same as the owner's resume, so the page and the file agree
  const d = (v: string) => formatResumeDate(clip(v, 40), style);
  const range = (a: string, b: string) => [d(a), d(b)].filter(Boolean).join(" – ");

  const name = clip(data.contact?.fullName, 100);
  const skills = hidden.has("skills") ? [] : list(data.skills, 40, 60);
  const exp = hidden.has("experience") ? [] : rows<ExperienceEntry>(data.experience, 12);
  const role = clip(exp[0]?.role, 100);
  const headline = [role, skills.slice(0, 3).join(", ")].filter(Boolean).join(" | ").slice(0, 160);

  // Work authorization and nationality are personal details: only when the owner switched them on,
  // and nationality only where a CV normally carries it (the Gulf), matching lib/contact.ts.
  const facts: PublicProfile["facts"] = [];
  if (src.show_personal) {
    const visa = clip(data.contact?.visaStatus, 120);
    if (visa) facts.push({ label: market ? VISA_LABEL[market] : "Visa status", value: visa });
    const nationality = clip(data.contact?.nationality, 80);
    if (nationality && market === "GULF") facts.push({ label: "Nationality", value: nationality });
  }

  const links: PublicProfile["links"] = [];
  if (src.show_links) {
    const li = safeHttpUrl(data.contact?.linkedin);
    const web = safeHttpUrl(data.contact?.website);
    if (li) links.push({ label: "LinkedIn", url: li });
    if (web) links.push({ label: "Website", url: web });
  }

  return {
    market,
    name,
    headline,
    place: src.show_city ? cityOf(data.contact?.location) : "",
    summary: hidden.has("summary") ? "" : clip(data.summary, 1200),
    email: src.show_contact ? clip(data.contact?.email, 120) : "",
    phone: src.show_contact ? clip(data.contact?.phone, 40) : "",
    links,
    facts,
    experience: exp.map((e) => ({
          role: clip(e.role, 100),
          company: clip(e.company, 100),
          dates: range(e.startDate, e.endDate),
          bullets: list(e.bullets, 12, 400),
        })),
    projects: hidden.has("projects")
      ? []
      : rows<ProjectEntry>(data.projects, 8).map((p) => ({
          name: clip(p.name, 100),
          description: clip(p.description, 500),
          tech: clip(p.tech, 150),
          url: src.show_links ? safeHttpUrl(p.link) : "",
        })),
    education: hidden.has("education")
      ? []
      : rows<EducationEntry>(data.education, 6).map((e) => ({
          degree: clip(e.degree, 120),
          school: clip(e.school, 120),
          dates: range(e.startDate, e.endDate),
          grade: clip(e.grade, 60),
        })),
    certifications: hidden.has("certifications")
      ? []
      : rows<CertificationEntry>(data.certifications, 10).map((x) => ({
          name: clip(x.name, 120),
          detail: [clip(x.issuer, 80), d(clip(x.date, 40))].filter(Boolean).join(", "),
        })),
    skills,
    languages: hidden.has("languages") ? [] : list(data.languages, 10, 60).map(splitLanguage),
    achievements: hidden.has("achievements") ? [] : list(data.achievements, 10, 300),
    hasPhoto: src.has_photo,
    photoVersion: src.photo_etag ?? "",
  };
}

/** Just enough for the page title and link preview: a name and a job title, never a photo or contact. */
export function profileTitle(p: PublicProfile): string {
  const role = p.headline.split("|")[0].trim();
  return role ? `${p.name} | ${role}` : p.name || "Profile";
}
