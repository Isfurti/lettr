/** Content for the four public feature pages that sit in front of signed-in tools. */
export type FeaturePage = {
  slug: string;
  /** ?continue= value that takes the person to the real feature after they sign up or log in. */
  continueKey: "linkedin" | "interview" | "resignation" | "tracker";
  /** Where signed-in people open the real feature. */
  appHref: string;
  /** "free" means a free account can use it; "pro" means it is part of Pro. */
  access: "free" | "pro";
  eyebrow: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  image: string;
  imageAlt: string;
  openLabel: string;
  signupLabel: string;
  /** One line under the sign-up button about what a free account gets. */
  accessNote: string;
  steps: { t: string; b: string }[];
  faq: { q: string; a: string }[];
};

export const FEATURE_PAGES: FeaturePage[] = [
  {
    slug: "linkedin-optimizer",
    continueKey: "linkedin",
    appHref: "/dashboard/linkedin",
    access: "pro",
    eyebrow: "LinkedIn",
    title: "LinkedIn profile optimizer",
    metaTitle: "LinkedIn Profile Optimizer: Headline and About | Lettr",
    metaDescription:
      "Paste your LinkedIn headline, About and experience, pick a target role and country, and Lettr rewrites them. You copy the result back yourself.",
    intro: "Get a stronger headline, About section and experience points for the role you want. Lettr rewrites your text; you copy it back to LinkedIn.",
    image: "/features/linkedin.webp",
    imageAlt: "Lettr LinkedIn profile page with target role, country and boxes for headline, About and experience",
    openLabel: "Open LinkedIn optimizer",
    signupLabel: "Create a free account",
    accessNote: "The LinkedIn optimizer is part of Lettr Pro. A free account lets you look around and upgrade when you are ready.",
    steps: [
      { t: "Add your profile text", b: "Paste your headline, About and experience, upload your LinkedIn PDF, or start from one of your Lettr resumes." },
      { t: "Pick the role and country", b: "Say which role you are aiming for and where, so the wording suits that job market." },
      { t: "Get a rewrite", b: "Lettr writes a new headline, About section and experience points. Edit them, then copy them into LinkedIn." },
    ],
    faq: [
      { q: "Does Lettr connect to my LinkedIn account?", a: "No. Lettr cannot read or change your LinkedIn page. You paste your text (or upload your PDF) and copy the result back yourself." },
      { q: "Are my pasted text and PDF saved?", a: "No. They are used for that request only and are not saved." },
      { q: "Is it free?", a: "The LinkedIn optimizer is part of Lettr Pro." },
    ],
  },
  {
    slug: "interview-practice",
    continueKey: "interview",
    appHref: "/dashboard/interview",
    access: "free",
    eyebrow: "Interview practice",
    title: "AI interview practice",
    metaTitle: "AI Interview Practice: Questions and Feedback | Lettr",
    metaDescription:
      "Get 6 interview questions for your role, answer in your own words and get honest feedback on each. Pick your country. Your first set is free.",
    intro: "Practise the questions you are likely to get, and walk in prepared. Answer in your own words, out loud or typed, and get honest feedback.",
    image: "/features/interview.webp",
    imageAlt: "Lettr interview practice form with job title, company, resume, country and job post",
    openLabel: "Open interview practice",
    signupLabel: "Practise free",
    accessNote: "A free account includes one practice set. Pro gives you many more each month.",
    steps: [
      { t: "Enter the job", b: "Add the job title, and optionally the company, your resume and the job post, so the questions fit the role." },
      { t: "Choose the country", b: "Pick where you are interviewing, such as India, USA, UK, Europe or the Gulf. Questions and feedback follow how interviewers there ask and judge." },
      { t: "Answer and get feedback", b: "You get 6 questions. Answer each one, and get honest feedback and a stronger way to say it." },
    ],
    faq: [
      { q: "Is it free?", a: "A free account includes one practice set of 6 questions with feedback. Pro includes many more each month." },
      { q: "Do I need the job post?", a: "No. A job title is enough. Adding the job post and your resume makes the questions sharper." },
      { q: "Can I answer out loud?", a: "Yes. You can type your answer or say it out loud." },
    ],
  },
  {
    slug: "resignation-letters",
    continueKey: "resignation",
    appHref: "/builder/new?tab=resignation-letter",
    access: "pro",
    eyebrow: "Resignation letter",
    title: "Resignation letter writer",
    metaTitle: "AI Resignation Letter Writer with Designs | Lettr",
    metaDescription:
      "Write a polite resignation letter from your name, job title, company, last working day and tone, then pick a design and download it as a PDF.",
    intro: "Write a clear, polite resignation letter in a minute. Choose the tone and a design that matches your resume.",
    image: "/features/resignation.webp",
    imageAlt: "Lettr resignation letter tab with name, job title, company, last working day, tone and letter designs",
    openLabel: "Open resignation letter writer",
    signupLabel: "Create a free account",
    accessNote: "The resignation letter writer is part of Lettr Pro. A free account lets you look around and upgrade when you are ready.",
    steps: [
      { t: "Open the Resignation letter tab", b: "It sits in the same editor as your resume, next to Cover letter, so your name and details are already filled in." },
      { t: "Add your details", b: "Your job title, company, your manager's name if you like, your last working day and the tone: for example warm or neutral." },
      { t: "Pick a design and download", b: "Choose a letter design, edit the text, and download it as a PDF." },
    ],
    faq: [
      { q: "Can I edit the letter?", a: "Yes. Read it through and change anything before you download." },
      { q: "Is it free?", a: "The resignation letter writer is part of Lettr Pro." },
      { q: "Does it match my resume?", a: "The letter designs use your name, contact details and accent colour." },
    ],
  },
  {
    slug: "job-tracker",
    continueKey: "tracker",
    appHref: "/dashboard/applications",
    access: "pro",
    eyebrow: "Job tracker",
    title: "Job application tracker",
    metaTitle: "Job Application Tracker: Board, Next Steps and Dates | Lettr",
    metaDescription:
      "Keep every job application in one place with a board, next steps and dates. Link the resume you sent, check your match and write a cover letter in one tap.",
    intro: "Every job you are going for, and what to do next. Move each one from Saved to Applied, Interviewing, Offer or Closed.",
    image: "/features/tracker.webp",
    imageAlt: "Lettr Applications board with counts, a Coming up list and columns for Saved, Applied, Interviewing, Offer and Closed",
    openLabel: "Open job tracker",
    signupLabel: "Create a free account",
    accessNote: "Adding new jobs to the tracker is part of Lettr Pro. A free account lets you look around and upgrade when you are ready.",
    steps: [
      { t: "Add an application", b: "Company, role, the link to the job post, location, status, the date you applied, a next step with a date, and notes." },
      { t: "Link the resume you sent", b: "Then check your match against the job post, or write a cover letter for it, in one tap." },
      { t: "Follow it on the board", b: "Counts at the top, a Coming up list by date, and five columns. Switch to list view and search by company or role." },
    ],
    faq: [
      { q: "Is it free?", a: "Adding new jobs is part of Lettr Pro. Jobs you already saved stay visible if you are on the free plan." },
      { q: "Will it remind me of next steps?", a: "Your next steps show under Coming up, sorted by date, and overdue ones turn red." },
      { q: "Can I use it on my phone?", a: "Yes. The board and list work in your phone browser." },
    ],
  },
];

export const featurePage = (slug: string) => FEATURE_PAGES.find((f) => f.slug === slug)!;
