import type { ResumeData } from "./types";

/** Realistic sample content used to preview templates before someone has written anything. */
export const SAMPLE_RESUME: ResumeData = {
  contact: {
    fullName: "Priya Sharma",
    email: "priya.sharma@email.com",
    phone: "+91 98765 43210",
    location: "Bengaluru, India",
    linkedin: "linkedin.com/in/priyasharma",
  },
  summary:
    "Product marketing manager with 6 years in B2B SaaS. Led 12 launches and grew pipeline 40% through sharper positioning and data-driven campaigns.",
  experience: [
    {
      id: "s1",
      role: "Senior Product Marketing Manager",
      company: "Freshworks",
      startDate: "Mar 2022",
      endDate: "Present",
      bullets: [
        "Led go-to-market for 5 product launches, generating ₹12 Cr in new pipeline",
        "Rebuilt competitive positioning, lifting win rate against top rival by 18%",
        "Built a launch playbook adopted by 4 product teams",
      ],
    },
    {
      id: "s2",
      role: "Marketing Manager",
      company: "Zoho",
      startDate: "Jun 2019",
      endDate: "Feb 2022",
      bullets: [
        "Grew organic sign-ups 65% with an SEO content program",
        "Managed a ₹2 Cr annual campaign budget across 6 channels",
      ],
    },
  ],
  education: [
    { id: "e1", school: "IIM Bangalore", degree: "MBA, Marketing", startDate: "2017", endDate: "2019" },
    { id: "e2", school: "Delhi University", degree: "B.Com", startDate: "2013", endDate: "2016" },
  ],
  skills: ["Go-to-market", "Positioning", "HubSpot", "SQL", "Google Analytics", "SEO", "Pricing"],
  certifications: [{ id: "c1", name: "Product Marketing Certified", issuer: "PMA", date: "2023" }],
  languages: ["English", "Hindi", "Kannada"],
  customization: {},
};

/** The same kind of sample for someone working in the USA, shown on the templates page. */
export const SAMPLE_RESUME_US: ResumeData = {
  contact: {
    fullName: "Jordan Miller",
    email: "jordan.miller@email.com",
    phone: "+1 (415) 555-0132",
    location: "San Francisco, CA",
    linkedin: "linkedin.com/in/jordanmiller",
  },
  summary:
    "Product marketing manager with 6 years in B2B SaaS. Led 12 launches and grew pipeline 40% through sharper positioning and data-driven campaigns.",
  experience: [
    {
      id: "u1",
      role: "Senior Product Marketing Manager",
      company: "Cloudnest",
      startDate: "Mar 2022",
      endDate: "Present",
      bullets: [
        "Led go-to-market for 5 product launches, generating $4.8M in new pipeline",
        "Rebuilt competitive positioning, lifting win rate against top rival by 18%",
        "Built a launch playbook adopted by 4 product teams",
      ],
    },
    {
      id: "u2",
      role: "Marketing Manager",
      company: "Brightlane Software",
      startDate: "Jun 2019",
      endDate: "Feb 2022",
      bullets: ["Grew organic sign-ups 65% with an SEO content program", "Managed a $900K annual campaign budget across 6 channels"],
    },
  ],
  education: [
    { id: "ue1", school: "University of California, Berkeley", degree: "MBA, Marketing", startDate: "2017", endDate: "2019" },
    { id: "ue2", school: "University of Washington", degree: "B.A. Economics", startDate: "2011", endDate: "2015" },
  ],
  skills: ["Go-to-market", "Positioning", "HubSpot", "SQL", "Google Analytics", "SEO", "Pricing"],
  certifications: [{ id: "uc1", name: "Product Marketing Certified", issuer: "PMA", date: "2023" }],
  languages: ["English", "Spanish"],
  customization: {},
};

/** And for someone working in the UK. */
export const SAMPLE_RESUME_UK: ResumeData = {
  contact: {
    fullName: "Sophie Turner",
    email: "sophie.turner@email.com",
    phone: "+44 7700 900789",
    location: "London, UK",
    linkedin: "linkedin.com/in/sophieturner",
  },
  summary:
    "Product marketing manager with 6 years in B2B SaaS. Led 12 launches and grew pipeline 40% through sharper positioning and data-driven campaigns.",
  experience: [
    {
      id: "k1",
      role: "Senior Product Marketing Manager",
      company: "Thamesbridge Software",
      startDate: "Mar 2022",
      endDate: "Present",
      bullets: [
        "Led go-to-market for 5 product launches, generating £3.6M in new pipeline",
        "Rebuilt competitive positioning, lifting win rate against top rival by 18%",
        "Built a launch playbook adopted by 4 product teams",
      ],
    },
    {
      id: "k2",
      role: "Marketing Manager",
      company: "Northgate Digital",
      startDate: "Jun 2019",
      endDate: "Feb 2022",
      bullets: ["Grew organic sign-ups 65% with an SEO content programme", "Managed a £700K annual campaign budget across 6 channels"],
    },
  ],
  education: [
    { id: "ke1", school: "London Business School", degree: "MBA", startDate: "2017", endDate: "2019" },
    { id: "ke2", school: "University of Bristol", degree: "BSc (Hons) Economics, 2:1", startDate: "2012", endDate: "2015" },
  ],
  skills: ["Go-to-market", "Positioning", "HubSpot", "SQL", "Google Analytics", "SEO", "Pricing"],
  certifications: [{ id: "kc1", name: "CIM Diploma in Professional Marketing", issuer: "Chartered Institute of Marketing", date: "2021" }],
  languages: ["English", "French"],
  customization: {},
};

export const TEMPLATE_SAMPLES = [
  { id: "in", label: "India", data: SAMPLE_RESUME },
  { id: "us", label: "USA", data: SAMPLE_RESUME_US },
  { id: "uk", label: "UK", data: SAMPLE_RESUME_UK },
] as const;

export type TemplateSampleId = (typeof TEMPLATE_SAMPLES)[number]["id"];
