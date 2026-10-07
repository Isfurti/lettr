import type { ResumeData } from "./types";

/**
 * Made-up example people used on the home page. They are illustrations of
 * what Lettr's real templates look like with real-world content; none of
 * them is presented as a customer or a testimonial.
 */
function job(id: string, role: string, company: string, startDate: string, endDate: string, bullets: string[]) {
  return { id, role, company, startDate, endDate, bullets };
}
function edu(id: string, degree: string, school: string, endDate: string) {
  return { id, degree, school, startDate: "", endDate };
}

export const HERO_EXAMPLE: ResumeData = {
  contact: { fullName: "Aisha Mehra", email: "aisha@email.com", location: "Bengaluru" },
  summary: "Product marketer with 6 years in B2B software. I turn complex features into launches people understand.",
  experience: [
    job("h1", "Product Marketing Manager", "Brightline", "2022", "Present", [
      "Led 4 product launches that brought in 1,800 qualified leads",
      "Rebuilt the email programme, lifting open rates from 18% to 27%",
      "Wrote the sales playbook used by a 20-person team in 3 regions",
    ]),
    job("h2", "Marketing Associate", "Northwind", "2019", "2022", [
      "Wrote and tested landing pages for 3 regional campaigns",
      "Ran webinars that added 600 sign-ups in one quarter",
    ]),
  ],
  education: [edu("he1", "MBA, Marketing", "Symbiosis, Pune", "2019"), edu("he2", "B.A. English", "Christ University", "2015")],
  certifications: [{ id: "hc1", name: "Google Analytics Certification", issuer: "Google", date: "2023" }],
  skills: ["Positioning", "SEO", "HubSpot", "SQL", "A/B testing"],
  customization: {},
};

export const AFTER_EXAMPLE: ResumeData = {
  contact: { fullName: "Rahul Verma", email: "rahul.v@email.com", location: "Delhi" },
  summary: "Regional sales executive with 5 years in B2B distribution, known for opening new dealer accounts and keeping them.",
  experience: [
    job("a1", "Sales Executive", "Apex Distributors", "2021", "Present", [
      "Grew North region revenue from ₹2.1 Cr to ₹3.4 Cr in 18 months",
      "Signed 26 new dealers across 4 cities; 9 in 10 still order a year on",
      "Built a weekly pipeline report now used by the whole team",
    ]),
    job("a2", "Sales Trainee", "Kumar Traders", "2019", "2021", [
      "Supported 3 senior reps on 40+ dealer visits a month",
      "Cleaned the customer database, halving duplicate records",
    ]),
  ],
  education: [edu("ae1", "B.Com", "Delhi University", "2019")],
  certifications: [{ id: "ac1", name: "Advanced Excel for Sales", issuer: "Online course", date: "2022" }],
  skills: ["B2B sales", "Dealer management", "CRM", "Negotiation", "Excel reporting", "Hindi and English"],
  customization: {},
};

export type CareerStage = {
  id: string;
  tab: string;
  template: string;
  templateName: string;
  headline: string;
  situation: string;
  helps: string[];
  cta: string;
  resume: ResumeData;
};

export const CAREER_STAGES: CareerStage[] = [
  {
    id: "student",
    tab: "Student or fresher",
    template: "bold",
    templateName: "Bold",
    headline: "Your first job, without the blank page",
    situation: "You have projects, internships and college work, but no idea how to make them look like experience.",
    helps: [
      "A projects section that turns college work into real experience.",
      "AI rewrites that turn \"helped with\" into what you actually achieved.",
      "The free plan covers your first resume and a clean PDF download.",
    ],
    cta: "Start my first resume",
    resume: {
      contact: { fullName: "Riya Sharma", email: "riya.sharma@email.com", location: "Chennai" },
      summary: "Final-year B.Tech student who builds web apps people actually use. Looking for my first frontend developer role.",
      experience: [
        job("r1", "Frontend Intern", "Kite Labs", "May 2026", "Jul 2026", [
          "Built 6 reusable React components for the checkout page",
          "Cut page load time by 30% by lazy-loading images",
        ]),
      ],
      projects: [{ id: "rp1", name: "CampusRide", description: "Carpool app for students, used by 300+ classmates. Led a team of 4." }],
      education: [edu("re1", "B.Tech, Computer Science", "Anna University", "2026")],
      skills: ["React", "JavaScript", "Figma", "Git", "Python"],
      customization: {},
    },
  },
  {
    id: "switch",
    tab: "Changing careers",
    template: "classic",
    templateName: "Classic",
    headline: "Show your skills fit somewhere new",
    situation: "You know you can do the new job. Your resume still reads like the old one.",
    helps: [
      "Job match shows which skills the new role asks for, and which you already have.",
      "A summary that leads with what carries over, not your old job title.",
      "Cover letters that explain your move in a sentence (your first one free).",
    ],
    cta: "Start my career switch",
    resume: {
      contact: { fullName: "Arjun Nair", email: "arjun.nair@email.com", location: "Kochi" },
      summary: "Teacher of 7 years moving into corporate learning design. I turn complex topics into lessons people finish.",
      experience: [
        job("s1", "Senior Science Teacher", "Greenfield School", "2018", "2025", [
          "Designed a 40-lesson blended course now used by 6 teachers",
          "Raised the class board-exam average from 68% to 81%",
        ]),
        job("s2", "Freelance Course Designer", "Self-employed", "2024", "Present", ["Built 3 short online courses for an edtech startup"]),
      ],
      education: [edu("se1", "M.Sc. Physics", "Calicut University", "2016")],
      skills: ["Storyboarding", "Articulate 360", "Canva", "Training delivery", "Assessment design"],
      customization: {},
    },
  },
  {
    id: "pro",
    tab: "Experienced professional",
    template: "modern",
    templateName: "Modern",
    headline: "Apply for the bigger role in minutes",
    situation: "You have years of wins. You just don't have hours to rewrite your resume for every opening.",
    helps: [
      "Paste a job post and see your match score and missing keywords.",
      "The AI Resume Agent edits your resume when you ask in plain words (Pro).",
      "Keep several versions, one for each kind of role.",
    ],
    cta: "Tailor my resume",
    resume: {
      contact: { fullName: "Meera Iyer", email: "meera.iyer@email.com", location: "Mumbai" },
      summary: "Product leader with 9 years in fintech. I build payment products people trust and teams that ship on time.",
      experience: [
        job("p1", "Senior Product Manager", "PayNest", "2021", "Present", [
          "Led the autopay launch: 1.2 million users in year one",
          "Grew the product team from 3 to 11 people",
        ]),
        job("p2", "Product Manager", "Ledgerly", "2017", "2021", ["Cut failed payments by 18% with smarter retries"]),
      ],
      education: [edu("pe1", "MBA", "IIM Bangalore", "2016")],
      skills: ["Product strategy", "Payments", "SQL", "Roadmaps", "Hiring"],
      customization: {},
    },
  },
  {
    id: "return",
    tab: "Returning after a break",
    template: "elegant",
    templateName: "Elegant",
    headline: "Come back with confidence",
    situation: "You took time away for family, health, study or travel. Now you want back in, and the gap worries you.",
    helps: [
      "Describe your career break honestly, as its own entry.",
      "Put recent courses and refreshed skills where recruiters look first.",
      "A live score that tells you what to fix next.",
    ],
    cta: "Plan my return",
    resume: {
      contact: { fullName: "Fatima Khan", email: "fatima.khan@email.com", location: "Hyderabad" },
      summary: "Chartered Accountant with 6 years in audit and tax, returning after a planned career break with refreshed GST and Ind AS training.",
      experience: [
        job("f1", "Career break", "Family care", "2021", "2024", ["Completed GST certification and an Ind AS refresher in 2024"]),
        job("f2", "Audit Manager", "Rao and Associates", "2015", "2021", [
          "Led statutory audits for 20+ mid-size clients",
          "Trained 8 junior auditors on audit software",
        ]),
      ],
      education: [edu("fe1", "Chartered Accountant", "ICAI", "2015")],
      skills: ["Audit", "GST", "Ind AS", "Tally", "Excel"],
      customization: {},
    },
  },
  {
    id: "trades",
    tab: "Skilled trades",
    template: "classic",
    templateName: "Classic",
    headline: "Your skills deserve a proper resume",
    situation: "You're great with your hands, not with writing about yourself. You need a resume that's quick to make on your phone.",
    helps: [
      "Simple questions, plain language, done on a phone.",
      "Show licences, certificates and safety training clearly.",
      "Download a clean PDF to send by email or WhatsApp.",
    ],
    cta: "Make my resume",
    resume: {
      contact: { fullName: "Suresh Kumar", email: "suresh.k@email.com", phone: "+91 98XXX XXXXX", location: "Hosur" },
      summary: "Licensed electrician with 10 years keeping offices and factories running safely.",
      experience: [
        job("t1", "Facilities Electrician", "Greenline Tech Park", "2019", "Present", [
          "Look after power systems for 3 office towers",
          "Cut breakdown calls by a third with monthly checks",
        ]),
        job("t2", "Electrician", "Sri Lakshmi Electricals", "2014", "2019", ["Wired 150+ homes and shops to safety code"]),
      ],
      education: [edu("te1", "ITI, Electrician trade", "Govt ITI Hosur", "2013")],
      skills: ["Wiring", "Panel maintenance", "Lockout safety", "DG sets", "Team supervision"],
      certifications: [{ id: "tc1", name: "Licensed Electrician (Class B)", issuer: "State Electrical Board", date: "2014" }],
      customization: {},
    },
  },
];
