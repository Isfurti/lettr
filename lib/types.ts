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
  photoDataUrl?: string; // base64 data URI of an uploaded profile photo
  showPhoto?: boolean; // whether to actually display the photo, even if uploaded
  showDividers?: boolean; // section rule lines - defaults to true (current look)
  indentBullets?: boolean; // indent bullet text under the role - defaults to true (current look)
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
