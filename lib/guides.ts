/**
 * Resume and job-search guides shown at /guides. Plain data so the index,
 * article pages and sitemap all read from one list.
 */

export type GuideSection = {
  heading: string;
  paragraphs?: string[];
  list?: string[];
  /** Numbered steps instead of bullets. */
  ordered?: boolean;
};

export type Guide = {
  slug: string;
  title: string;
  /** Meta description and card blurb. */
  description: string;
  /** ISO date, e.g. "2026-10-18". */
  published: string;
  updated?: string;
  readMinutes: number;
  intro: string;
  sections: GuideSection[];
  /** Where the end-of-article button goes. */
  cta: { label: string; href: string };
  /** Example slugs from lib/examples.ts to link at the end. */
  relatedExamples?: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "resume-format-for-freshers",
    title: "Resume format for freshers in 2026 (with examples)",
    description:
      "The one-page fresher resume format recruiters and ATS software read best: what to include, in what order, and the mistakes that get first resumes rejected.",
    published: "2026-10-18",
    readMinutes: 6,
    intro:
      "Your first resume doesn't need years of experience. It needs a clear format, the right keywords and proof of what you can do. Here's the format that works for campus placements, off-campus applications and job portals in India.",
    sections: [
      {
        heading: "The fresher resume format, top to bottom",
        ordered: true,
        list: [
          "Contact details: name, phone, professional email, city and LinkedIn. Skip photo, date of birth, marital status and father's name unless a form asks.",
          "Career objective: two or three lines naming the role you want and what you bring.",
          "Education: degree, college, graduation year and CGPA or percentage. Add Class 12 and 10 if they're strong or the company asks.",
          "Projects and internships: your real experience as a fresher. Two or three bullets each.",
          "Skills: the tools and skills the job post asks for.",
          "Achievements and certifications: hackathons, competitions, NPTEL or industry certificates, leadership roles.",
        ],
      },
      {
        heading: "Keep it to one page",
        paragraphs: [
          "Recruiters spend seconds on a first look. A single page with clear headings shows you can prioritise. If you're over a page, cut school-level achievements first, then older or weaker projects.",
        ],
      },
      {
        heading: "Write a career objective that isn't generic",
        paragraphs: [
          "Avoid lines like \"Seeking a challenging position in a reputed organisation.\" Every fresher writes that, so it tells the reader nothing.",
          "Instead, name the role and give one piece of proof: \"B.Com graduate looking for an accounts executive role. Completed a 3-month internship handling GST filing and Tally entries for 40+ clients.\"",
        ],
      },
      {
        heading: "Turn projects into experience",
        paragraphs: [
          "Write each project like a job: what you built or did, the tools you used, and the result. Numbers make it believable.",
        ],
        list: [
          "Weak: \"Did a project on an e-commerce website.\"",
          "Strong: \"Built an e-commerce site in React and Node.js with cart and payment flows; tested by 50 classmates during a college fest.\"",
          "Weak: \"Internship at a marketing agency.\"",
          "Strong: \"Wrote 30 Instagram posts for 3 clients during a 2-month internship; one campaign grew a client's followers by 18%.\"",
        ],
      },
      {
        heading: "Pick a template software can read",
        paragraphs: [
          "Many companies and job portals run resumes through an applicant tracking system (ATS) first. Fancy two-column designs, text inside images, tables and icons can scramble what it reads. A clean, single-column layout with standard headings like \"Education\" and \"Projects\" is safest.",
        ],
      },
      {
        heading: "Common fresher mistakes",
        list: [
          "Sending one resume to every job instead of matching each job post's keywords",
          "Listing duties (\"responsible for\") instead of results",
          "Spelling mistakes and an unprofessional email address",
          "Exaggerating skills you can't talk about in the interview",
          "Saving the file as \"resume.pdf\" instead of \"FirstName-LastName-Resume.pdf\"",
        ],
      },
    ],
    cta: { label: "Build my fresher resume, free", href: "/resume-builder-for-freshers" },
    relatedExamples: ["campus-placement-software-engineer", "mba-fresher-marketing", "bcom-fresher-accounts", "mechanical-engineer-fresher"],
  },
  {
    slug: "naukri-resume",
    title: "How to make a resume for Naukri that recruiters find",
    description:
      "Recruiters search Naukri by keywords. Here's how to write your resume, headline and key skills so you show up in searches and get more calls.",
    published: "2026-10-18",
    readMinutes: 5,
    intro:
      "On Naukri, recruiters usually find you before they read you. They search the database by job title, skills, location and experience, then open the profiles that match. So your resume and profile need the words recruiters type, not just a nice layout.",
    sections: [
      {
        heading: "1. Find the keywords for your target role",
        paragraphs: [
          "Open five to ten job posts for the role you want and note the skills and titles that keep repeating, like \"Tally ERP\", \"GST\", \"Excel\" or \"React\", \"REST APIs\", \"SQL\". These are the words recruiters search for.",
          "Use the exact wording from the posts. If they say \"Accounts Executive\", don't call yourself an \"Accounting Associate\".",
        ],
      },
      {
        heading: "2. Put those keywords in your resume, honestly",
        list: [
          "In your career objective or summary, name the role and two or three core skills",
          "In each job, internship or project, mention the tools you actually used",
          "In a skills section, list the tools and skills from the job posts that you really have",
        ],
        paragraphs: ["Only add skills you can discuss in an interview. Recruiters do ask."],
      },
      {
        heading: "3. Write a strong resume headline",
        paragraphs: [
          "Your Naukri resume headline is one of the first things a recruiter sees in search results. Make it specific: role, experience and two key skills.",
          "Example: \"Accounts Executive | 2 years | GST, Tally ERP, Excel\" or \"Fresher Java Developer | Spring Boot, SQL | B.Tech CSE 2026\".",
        ],
      },
      {
        heading: "4. Fill in key skills and the profile summary",
        paragraphs: [
          "Add your most important skills in the key skills field, using the same words as your resume. Keep your profile summary to a few lines that match your resume's objective.",
        ],
      },
      {
        heading: "5. Upload a clean, readable file",
        list: [
          "Use a simple single-column template so the text is read correctly",
          "Upload a PDF or Word file and keep it small",
          "Name it \"FirstName-LastName-Resume\"",
          "Make sure your phone and email are correct and in plain text, not inside an image",
        ],
      },
      {
        heading: "6. Keep your profile fresh",
        paragraphs: [
          "Recruiters often prefer recently active candidates. Update your resume or profile every week or two while you're job hunting, even with a small change like a new project or certificate.",
        ],
      },
    ],
    cta: { label: "Check how ATS software reads my resume", href: "/resume-checker" },
    relatedExamples: ["accountant", "software-engineer", "sales-executive", "customer-support-executive"],
  },
  {
    slug: "ats-friendly-resume",
    title: "How to make an ATS-friendly resume (and beat the ATS)",
    description:
      "What applicant tracking systems actually do, why good resumes get filtered out, and a simple checklist to make sure yours gets read by a person.",
    published: "2026-10-18",
    readMinutes: 6,
    intro:
      "An applicant tracking system (ATS) is software companies use to collect, sort and search resumes. It doesn't \"reject\" you on its own as often as people think, but it can misread your resume or rank it low when recruiters search. Here's how to make sure it reads yours correctly.",
    sections: [
      {
        heading: "What an ATS does with your resume",
        list: [
          "Reads the text from your file and splits it into fields: contact details, work history, education and skills",
          "Stores it in a database that recruiters search by keywords, titles and locations",
          "Often ranks or filters candidates by how well they match the job",
        ],
        paragraphs: ["If the software can't read your text, or the keywords aren't there, a recruiter may never see your resume."],
      },
      {
        heading: "Formatting that ATS software reads well",
        list: [
          "A single-column layout with standard headings: Summary, Experience, Education, Skills",
          "Real text, never text inside images or graphics",
          "Common fonts and normal bullet points",
          "Dates in a consistent format, like \"Jun 2024 – Present\"",
          "Contact details in the main body, not only in the header or footer",
          "PDF or Word files, unless the job asks for something else",
        ],
      },
      {
        heading: "Formatting that causes trouble",
        list: [
          "Text boxes, tables and multiple columns",
          "Skill bars, star ratings, icons and photos",
          "Fancy headings like \"My Journey\" instead of \"Experience\"",
          "Scanned resumes or screenshots saved as PDF",
        ],
      },
      {
        heading: "Match the keywords in the job post",
        paragraphs: [
          "Read the job post and pick out the skills, tools and qualifications it mentions. If you have them, use the same words in your resume, in your summary, your bullets and your skills section.",
          "Don't paste the whole job post or hide keywords in white text. Recruiters and modern systems spot it, and it reads badly when a person opens your resume.",
        ],
      },
      {
        heading: "A quick ATS checklist before you apply",
        ordered: true,
        list: [
          "Is your resume single-column with standard headings?",
          "Can you select and copy all the text in the PDF?",
          "Are your name, phone, email and city in plain text near the top?",
          "Does it include the main skills and job title from the job post?",
          "Are your dates and job titles clear and consistent?",
          "Is the file named with your name?",
        ],
      },
      {
        heading: "Test it before you send it",
        paragraphs: [
          "The easiest check is to see what the software actually reads. Lettr's free ATS checker shows the text an ATS pulls from your resume, flags what's missing and gives you fixes, with no account needed.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["data-analyst", "business-analyst", "hr-executive", "digital-marketing-executive"],
  },
  {
    slug: "cover-letter-format",
    title: "Cover letter format for jobs in India (with example)",
    description:
      "A simple four-part cover letter format with a real example, what to write in each part, how long it should be, and the mistakes to avoid.",
    published: "2026-10-18",
    readMinutes: 5,
    intro:
      "A good cover letter is short, specific and about the job in front of you. It shouldn't repeat your resume. It should show why you're a strong fit for this role at this company. Here's a format you can use for almost any job.",
    sections: [
      {
        heading: "The four-part format",
        ordered: true,
        list: [
          "Opening (2 lines): the role you're applying for and one line on why you're a strong fit",
          "Proof (one short paragraph): two achievements from your resume that match what the job asks for, ideally with numbers",
          "Why this company (2-3 lines): something specific, like a product, a market or a value, that shows you're not mass-applying",
          "Close (1-2 lines): say you'd welcome a conversation, then sign off with your name and phone number",
        ],
      },
      {
        heading: "How long should it be?",
        paragraphs: ["Under one page: three or four short paragraphs, about 200 to 320 words. Shorter is fine for email applications."],
      },
      {
        heading: "Example (fictional)",
        paragraphs: [
          "Dear Hiring Team,",
          "I'm applying for the Accounts Executive role at Brightway Traders. I've spent two years handling GST returns and month-end closing for a 60-client CA firm, and your growing distribution business is exactly where I'd like to use that experience.",
          "At Sharma & Associates I filed GST returns for 40+ clients every month with zero late filings, and set up a Tally workflow that cut our month-end closing from six days to four. Your job post asks for GST and Tally experience, which is what I do every day.",
          "I'd welcome the chance to talk about how I can support Brightway's accounts team.",
          "Regards, Neha Gupta · +91 98000 00000",
        ],
      },
      {
        heading: "Mistakes to avoid",
        list: [
          "Starting with \"I am writing to apply for…\"",
          "Copying your resume line by line",
          "Sending the same letter to every company",
          "Writing about what you want instead of what you'll bring",
          "Spelling the company's or hiring manager's name wrong",
        ],
      },
      {
        heading: "Do you still need a cover letter?",
        paragraphs: [
          "Not for every job. Many recruiters skip them. But for competitive roles, career changes, small companies and jobs that ask for one, a short, specific letter can tip the balance.",
        ],
      },
    ],
    cta: { label: "Write my cover letter, free", href: "/tools/cover-letter-writer" },
    relatedExamples: ["accountant", "chartered-accountant", "brand-manager", "product-manager"],
  },
  {
    slug: "ats-resume-example",
    title: "ATS resume example: a sample you can copy (2026)",
    description:
      "See what an ATS-friendly resume looks like, section by section, with sample wording you can adapt. Plain format, real keywords and bullets that show results.",
    published: "2026-11-09",
    readMinutes: 6,
    intro:
      "Most ATS advice tells you what to avoid. This guide shows what a good one looks like: the layout, the wording of each section and a before-and-after for the bullets that matter most. Adapt it to your own facts, and never copy details that aren't yours.",
    sections: [
      {
        heading: "The layout of an ATS resume, top to bottom",
        ordered: true,
        list: [
          "Name in large plain text, then phone, email, city and LinkedIn on one or two lines.",
          "Summary: two or three lines with your job title, years of experience and your strongest skills.",
          "Experience: job title, company, dates, then three to five bullets for each role, most recent first.",
          "Education: degree, college or university, year.",
          "Skills: a plain list of tools and skills, using the same words as the job post.",
          "Optional: certifications, projects, languages.",
        ],
      },
      {
        heading: "Sample summary",
        paragraphs: [
          "Data analyst with 3 years of experience in SQL, Excel and Power BI. Builds weekly sales dashboards and cleans messy data so teams can make decisions faster. Looking for an analyst role in e-commerce or retail.",
          "Notice what it does: it names the role, the tools and the work. Replace the example with your own title, years and tools.",
        ],
      },
      {
        heading: "Sample bullets: before and after",
        list: [
          "Before: Responsible for reports. After: Built weekly sales reports in Excel and Power BI for 4 regional managers.",
          "Before: Helped the marketing team. After: Ran email campaigns in Mailchimp and tracked open and click rates each week.",
          "Before: Worked on customer queries. After: Resolved customer queries by phone and email, and logged each case in the CRM.",
        ],
        paragraphs: [
          "Start each bullet with a verb, name the tool or method, and add a number when you honestly have one. If you don't have a number, describe the scale: how many people, how often, how big.",
        ],
      },
      {
        heading: "Sample skills section",
        paragraphs: [
          "SQL, Advanced Excel, Power BI, Python (pandas), Data cleaning, Dashboards, Stakeholder reporting.",
          "Only list what you can talk about in an interview. Use the exact spelling the job post uses, such as \"Power BI\" and not \"PowerBI\".",
        ],
      },
      {
        heading: "What makes this format ATS-friendly",
        list: [
          "One column, so the software reads it in the right order",
          "Standard headings: Summary, Experience, Education, Skills",
          "No tables, text boxes, icons or skill bars",
          "Real, selectable text in a PDF or Word file",
          "Consistent dates, for example Jun 2023 – Present",
        ],
      },
      {
        heading: "Check yours",
        paragraphs: [
          "Upload your resume to Lettr's free ATS checker to see the exact text hiring software reads, your score and the fixes that matter. No account needed.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["data-analyst", "business-analyst", "digital-marketing-executive"],
  },
  {
    slug: "ats-resume-checklist",
    title: "ATS resume checklist: 15 checks before you apply",
    description:
      "A simple 15-point ATS checklist: format, keywords, contact details and file type. Run through it before every application to avoid getting filtered out.",
    published: "2026-11-09",
    readMinutes: 5,
    intro:
      "Use this checklist before you send any application. Each point takes a few seconds to check, and together they catch most of the problems that make an ATS misread a resume.",
    sections: [
      {
        heading: "Format checks",
        ordered: true,
        list: [
          "One column, no tables or text boxes.",
          "Standard headings: Summary, Experience, Education, Skills.",
          "No photo, icons, charts, skill bars or star ratings.",
          "A common font, 10 to 12 points.",
          "Normal round bullet points, not special symbols or emoji.",
        ],
      },
      {
        heading: "Content checks",
        ordered: true,
        list: [
          "Your job title matches or is close to the title in the job post.",
          "The main skills and tools in the job post appear in your resume, if you really have them.",
          "Each role has dates in the same format.",
          "Bullets start with a verb and show what you did, not only your duties.",
          "Numbers are used where you honestly have them.",
        ],
      },
      {
        heading: "Contact and file checks",
        ordered: true,
        list: [
          "Name, phone, email and city are in plain text in the main body.",
          "Your email looks professional.",
          "The file is a PDF or Word document, unless the job says otherwise.",
          "You can select and copy all the text in the PDF. If you can't, it's an image.",
          "The file name includes your name, for example Priya-Sharma-Resume.pdf.",
        ],
      },
      {
        heading: "If you fail a check",
        paragraphs: [
          "Fix the format problems first, since they can stop the system from reading anything at all. Then work on keywords and bullets. A resume that reads cleanly and matches the job beats a fancy one every time.",
        ],
      },
      {
        heading: "Let a tool run the checks",
        paragraphs: [
          "Lettr's free ATS checker runs these checks for you. Upload your file and you'll see the plain text the software reads, a score and the fixes in order of importance.",
        ],
      },
    ],
    cta: { label: "Run the free ATS check", href: "/resume-checker" },
    relatedExamples: ["hr-executive", "accountant", "product-manager"],
  },
  {
    slug: "fresher-resume-examples",
    title: "Fresher resume examples: what to write with no experience",
    description:
      "Sample wording for a fresher resume: objective, projects, internships, skills and achievements. Real examples you can adapt for your degree, with no work experience needed.",
    published: "2026-11-09",
    readMinutes: 6,
    intro:
      "The hardest part of a first resume is knowing what to write when you haven't had a job. These examples show how to describe projects, internships and skills so a recruiter sees what you can do. Replace every detail with your own.",
    sections: [
      {
        heading: "Career objective examples",
        list: [
          "Computer science graduate with project experience in Java and SQL, looking for a software developer role where I can build and test real features.",
          "B.Com graduate with strong Excel and Tally skills, looking for an accounts executive role to apply my knowledge of bookkeeping and GST.",
          "MBA marketing graduate with an internship in social media, looking for a digital marketing role to run campaigns and track results.",
        ],
        paragraphs: ["Keep it to two or three lines. Name the role, one or two skills and what you want to do."],
      },
      {
        heading: "How to describe a project",
        paragraphs: [
          "Give the project a title, one line on what it does, and two or three bullets on what you built and the tools you used.",
        ],
        list: [
          "Attendance tracker (Python, SQLite): built a command-line app that records daily attendance and prints monthly summaries.",
          "College fest budget sheet (Excel): tracked income and expenses for a 3-day event and shared a weekly summary with the team.",
          "Instagram page for a local shop: wrote posts and tracked likes and reach every week for 2 months.",
        ],
      },
      {
        heading: "How to describe an internship",
        list: [
          "Wrote and scheduled 12 social media posts a month for a small clothing brand.",
          "Entered and checked purchase invoices in Tally under the supervision of the accounts manager.",
          "Tested new app screens and reported bugs to the development team in Jira.",
        ],
        paragraphs: ["Say only what you actually did. Small, true details beat big claims."],
      },
      {
        heading: "Skills a fresher can list",
        paragraphs: [
          "Pick skills you could be tested on. Examples: MS Excel, Tally, Python, SQL, Canva, Google Analytics, public speaking, English and Hindi.",
        ],
      },
      {
        heading: "Achievements and extras",
        list: [
          "College competitions, hackathons or paper presentations",
          "Leadership roles in clubs, NSS or NCC",
          "Online certificates from Coursera, NPTEL or Google",
          "Volunteering and part-time work",
        ],
      },
      {
        heading: "Build yours with help",
        paragraphs: [
          "Lettr's resume builder has fresher templates and an AI helper that turns rough notes into clear bullets without inventing facts. It's free to start.",
        ],
      },
    ],
    cta: { label: "Build my fresher resume", href: "/resume-builder-for-freshers" },
    relatedExamples: ["data-analyst", "digital-marketing-executive", "accountant"],
  },
  {
    slug: "bcom-llb-resume-example",
    title: "B.Com LLB resume example for law and corporate freshers",
    description:
      "How to write a resume with a B.Com LLB degree: what to include, how to present internships, moot courts and papers, and sample wording for law firms and corporate roles.",
    published: "2026-11-09",
    readMinutes: 5,
    intro:
      "A B.Com LLB degree opens doors in law firms, company legal teams, compliance, taxation and finance. Your resume should show both sides: the law you studied and the commerce skills that set you apart. Here's how to lay it out.",
    sections: [
      {
        heading: "What to include, in order",
        ordered: true,
        list: [
          "Contact details: name, phone, professional email, city and LinkedIn.",
          "Profile: two lines on your degree, your interest area and one or two strengths.",
          "Education: B.Com LLB, college, university, years and CGPA or percentage. Add the bar enrolment status if you have it.",
          "Internships: law firms, courts, companies or chambers, with what you worked on.",
          "Moot courts, research papers and publications.",
          "Skills and certifications.",
          "Positions of responsibility and achievements.",
        ],
      },
      {
        heading: "Sample profile",
        paragraphs: [
          "B.Com LLB graduate with internship experience in corporate and tax law. Comfortable with legal drafting, research and basic accounting. Looking for an associate role at a law firm or a legal executive role in a company.",
        ],
      },
      {
        heading: "How to describe internships",
        list: [
          "Drafted a first version of a rental agreement and a legal notice under the supervision of the senior associate.",
          "Researched case law on GST disputes and prepared a short summary note for the team.",
          "Assisted with company incorporation paperwork and filed forms on the MCA portal.",
          "Observed hearings at the district court and maintained case files.",
        ],
        paragraphs: ["Use only what you really did, and describe your part clearly, not the whole matter."],
      },
      {
        heading: "Show the commerce edge",
        paragraphs: [
          "Many law graduates can draft. Fewer can read a balance sheet. If you know Tally, Excel, GST or basic financial analysis, list them in your skills and mention where you used them.",
        ],
      },
      {
        heading: "Moot courts, papers and certifications",
        list: [
          "Moot court: name the competition, your role (speaker or researcher) and how far your team went.",
          "Research papers: title, journal or conference and year.",
          "Certificates: contract drafting, GST, company law, IPR or arbitration courses.",
        ],
      },
      {
        heading: "Keep it to one page",
        paragraphs: [
          "As a fresher, one page is enough. Use clear headings and plain formatting so that both a partner at a law firm and an ATS can read it quickly.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["accountant", "chartered-accountant", "hr-executive"],
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}
