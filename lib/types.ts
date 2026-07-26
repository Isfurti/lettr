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

export type ResumeCustomization = {
  accentColor?: string; // hex, e.g. "#b8862e" - defaults to app seal gold if unset
  fontChoice?: "editorial" | "elegant" | "classic"; // preview-only, see lib/fonts.ts
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
  customization?: ResumeCustomization;
};

export const emptyResume: ResumeData = {
  contact: { fullName: "", email: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
  customization: {},
};
