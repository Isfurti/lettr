export type ExperienceEntry = {
  id: string;
  company: string;
  role: string;
  location?: string;
  startDate: string;
  endDate: string; // "Present" allowed
  bullets: string[];
};

export type EducationEntry = {
  id: string;
  school: string;
  degree: string;
  startDate: string;
  endDate: string;
};

export type ProjectEntry = {
  id: string;
  name: string;
  link?: string;
  description: string;
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
};

export type ResumeData = {
  contact: {
    fullName: string;
    email: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    website?: string;
  };
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string[];
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
    projects: (data.projects ?? []).filter((p) => p.name.trim() || p.description.trim()),
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
