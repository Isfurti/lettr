export type ExperienceEntry = {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string; // "Present" allowed
  bullets: string[];
  /** Earlier job titles at the same company (promotions), newest first. role/startDate/endDate above are the current title. */
  earlierRoles?: EarlierRole[];
};

export type EarlierRole = {
  id: string;
  role: string;
  startDate: string;
  endDate: string;
};

/** A labelled group of skills, e.g. "Frontend: React, Next.js". */
export type SkillGroup = {
  id: string;
  name: string;
  skills: string[];
};

export type EducationEntry = {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
  /** e.g. "CGPA 8.4/10" or "First Class, 72%". */
  grade?: string;
  location?: string;
};

export type ProjectEntry = {
  id: string;
  name: string;
  link?: string;
  description: string;
  /** Tools and tech used, e.g. "Next.js · PostgreSQL · AWS S3". */
  tech?: string;
  bullets?: string[];
};

export type CertificationEntry = {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
};

export type ResumeCustomization = {
  accentColor?: string; // hex, e.g. "#b8862e" - defaults to app seal gold if unset
  fontChoice?: "editorial" | "elegant" | "classic"; // preview-only, see lib/fonts.ts
  photoDataUrl?: string; // base64 data URI of the final, cropped profile photo (what actually renders)
  photoOriginalDataUrl?: string; // the uploaded image before cropping - kept so "Adjust" can re-crop from scratch
  photoZoom?: number; // last-used zoom level, so reopening the adjuster starts where they left off
  photoOffsetX?: number; // last-used horizontal pan, 0-100 (percentage)
  photoOffsetY?: number; // last-used vertical pan, 0-100 (percentage)
  showPhoto?: boolean; // whether to actually display the photo, even if uploaded
  showDividers?: boolean; // section rule lines - defaults to true (current look)
  indentBullets?: boolean; // indent bullet text under the role - defaults to true (current look)
  // Layout controls (see lib/layout.ts)
  pageSize?: "A4" | "LETTER"; // PDF and Word page size - defaults to A4
  scale?: number; // text and spacing size, 0.75-1.1 - set by Spacing or "Fit to one page"
  sectionOrder?: string[]; // section keys in display order
  hiddenSections?: string[]; // section keys left off the resume
  dateStyle?: "short" | "long" | "numeric" | "year"; // how dates print - defaults to "Jan 2024"
  photoShape?: "circle" | "rounded" | "square";
  market?: "IN" | "US" | "UK" | "EU" | "GULF"; // "Applying in" - tunes AI and ATS advice (see lib/market.ts)
};

export type ResumeData = {
  contact: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
    // Optional personal details, offered for markets that expect them (see lib/contact.ts).
    nationality?: string;
    visaStatus?: string;
    dateOfBirth?: string;
  };
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
  /**
   * Skills sorted into labelled groups. When present, `skills` still holds every
   * skill (groups first, then any not in a group), so ATS and AI code can keep
   * reading the flat list.
   */
  skillGroups?: SkillGroup[];
  /** Set by applyLayout only (never saved): `skills` holds one "Label: a, b" line per group. */
  skillsGrouped?: boolean;
  // Optional sections - older saved resumes won't have these, so every
  // reader must treat them as possibly undefined (use the helpers below).
  projects?: ProjectEntry[];
  certifications?: CertificationEntry[];
  languages?: string[];
  achievements?: string[];
  customization?: ResumeCustomization;
};

/** Safe accessors for the optional sections, so render code never has to null-check. */
export function extraSections(data: ResumeData) {
  return {
    projects: (data.projects ?? []).filter((p) => p.name.trim() || p.description.trim() || (p.bullets ?? []).some((b) => b.trim())),
    certifications: (data.certifications ?? []).filter((c) => c.name.trim()),
    languages: (data.languages ?? []).filter((l) => l.trim()),
    achievements: (data.achievements ?? []).filter((a) => a.trim()),
  };
}

export const emptyResume: ResumeData = {
  contact: { fullName: "", email: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  customization: {},
};
