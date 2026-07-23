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
};

export const emptyResume: ResumeData = {
  contact: { fullName: "", email: "" },
  summary: "",
  experience: [],
  education: [],
  skills: [],
};
