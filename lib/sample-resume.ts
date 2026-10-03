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
