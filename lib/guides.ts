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
    updated: "2026-11-22",
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
      {
        heading: "A sample fresher resume (made-up person)",
        paragraphs: [
          "Here is the shape of a one-page fresher resume for a made-up B.Com graduate. The details are invented, so use them only as a pattern.",
          "Header: Rohan Mehta, Jaipur. 98xxxxxx00. rohan.mehta@example.com. linkedin.com/in/rohan-mehta-example.",
          "Objective: B.Com graduate looking for an accounts executive role. Completed a 3-month internship handling Tally entries and GST return workings for 40+ clients.",
        ],
        list: [
          "Education: B.Com, University of Rajasthan, 2026. 72%. Class 12 (Commerce), 78%.",
          "Internship: Accounts intern, a local CA firm (example), May to Jul 2025. Entered daily vouchers in Tally and prepared GST return workings for 40+ clients.",
          "Project: Built a monthly budget tracker in Excel with formulas and charts for a college fest team of 12.",
          "Skills: TallyPrime, MS Excel (VLOOKUP, pivot tables), GST basics, English and Hindi.",
          "Achievements: Treasurer of the college commerce society, 2025. Completed an online Excel course.",
        ],
      },
      {
        heading: "What to put in the skills section, by field",
        paragraphs: [
          "List only the tools you can use and talk about. These are examples of the kind of words that match common entry-level job posts.",
        ],
        list: [
          "Computer science and IT: programming languages you have used, SQL, Git, a framework or two, and basics like data structures.",
          "Commerce and accounting: Tally, MS Excel, GST and TDS basics, bank reconciliation.",
          "Mechanical and core engineering: AutoCAD or SolidWorks, ANSYS if you used it, Six Sigma or lean basics if you studied them.",
          "MBA and marketing: Excel, PowerPoint, Google Analytics basics, social media tools, a CRM if you used one.",
          "Any field: communication, a second language, and typing speed if the job needs it.",
        ],
      },
      {
        heading: "No internship or project yet?",
        paragraphs: [
          "Many first-time applicants worry about this. You usually have more than you think. Think about anything where you took responsibility or produced something, even without a salary.",
        ],
        list: [
          "College projects, mini-projects and your final-year project",
          "Coding, design or writing you did on your own, with a link if it is online",
          "Club, society or fest roles, such as treasurer, event lead or volunteer",
          "Part-time work, tuition or freelance jobs",
          "Online courses and certificates, with the name of the provider",
        ],
      },
      {
        heading: "Resume, CV or biodata?",
        paragraphs: [
          "In India people use these words loosely. For most private-sector and campus jobs, a one-page resume is what recruiters want. A CV can mean a longer document for academic or research roles. A biodata, with personal details such as date of birth and father's name, is old-style and is not needed for most jobs today. Follow the form or job post if it asks for something specific.",
        ],
      },
      {
        heading: "Check before you send",
        ordered: true,
        list: [
          "It fits on one page, with clear headings.",
          "Your email address is professional and your phone number is correct.",
          "Every skill and project is something you can explain in an interview.",
          "You have used words from the job post where they are true for you.",
          "The file is a PDF named FirstName-LastName-Resume.pdf, and you can select the text in it.",
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
    updated: "2026-11-22",
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
        heading: "Sample header",
        paragraphs: [
          "Below are the remaining pieces of an example for a made-up person, next to the summary, bullets and skills above. Every name, company and number below is invented. Use it only to copy the shape, and fill in your own facts.",
          "Header: Asha Verma, Pune, India. 98xxxxxx00. asha.verma@example.com. linkedin.com/in/asha-verma-example.",
        ],
      },
      {
        heading: "Sample experience entry",
        paragraphs: [
          "Data Analyst, Brightline Retail (example company), Jun 2023 – Present",
        ],
        list: [
          "Built weekly sales dashboards in Power BI for 4 regional managers, replacing a manual Excel report.",
          "Wrote SQL queries to pull order and returns data from the company database for monthly reviews.",
          "Cleaned and merged data from 3 sources in Python (pandas), cutting report preparation from two days to half a day.",
          "Presented findings to the sales head every month and suggested 2 changes to discount timing.",
        ],
      },
      {
        heading: "Sample education entry",
        paragraphs: [
          "B.Sc. Statistics, Savitribai Phule Pune University, 2023. CGPA 8.1/10.",
          "Keep education short once you have work experience. One or two lines is enough. A fresher can add coursework, projects and marks, but someone with a few years of experience rarely needs to.",
        ],
      },
      {
        heading: "How an ATS reads your file",
        paragraphs: [
          "An applicant tracking system, or ATS, does not look at your resume the way a person does. It first pulls the text out of your file and then tries to sort that text into fields such as name, job titles, dates, employers, education and skills. Recruiters then search and filter those fields.",
          "Systems differ, and no one outside the vendor knows exactly how each one works. But the same few things cause trouble again and again, so it is safest to avoid them.",
        ],
        list: [
          "Text in tables, columns or text boxes can be read in the wrong order, so a job title ends up next to the wrong company.",
          "Headings with unusual names, such as \"My Journey\" instead of \"Experience\", may not be recognised as a section.",
          "Text inside images, including some resume templates exported as pictures, often can't be read.",
          "Information in the header or footer of a Word file is sometimes skipped, so keep your contact details in the main body.",
          "Dates written in different styles on different lines make it harder to work out how long you stayed in each role.",
        ],
      },
      {
        heading: "Match the job post without stuffing keywords",
        paragraphs: [
          "Recruiters often search by skills and job titles. If the job post says \"Power BI\" and your resume only says \"business intelligence tools\", a search for the first may not find you. So it helps to use the same words the post uses, where they are true for you.",
        ],
        list: [
          "Read the job post and underline the tools, skills and job titles that appear more than once.",
          "Tick off the ones you really have. Skip the rest. Do not add skills you cannot talk about in an interview.",
          "Put those words into your summary, your skills section and your bullets, in natural sentences.",
          "Use both the short and long form once if people use both, for example \"search engine optimisation (SEO)\".",
          "Do not repeat a keyword again and again or hide it in white text. Recruiters notice it, and it reads badly when a person opens your resume.",
        ],
      },
      {
        heading: "Mistakes to avoid",
        list: [
          "Copying a sample word for word. The summary, bullets and numbers must be yours.",
          "Using one resume for every job instead of adjusting the summary and skills for each post.",
          "A creative layout with columns, icons and graphics. It may look good to a person but read badly to software.",
          "Listing every tool you have ever touched. A long skills list with no proof in your bullets is not convincing.",
          "Saving the file as a scanned image or a photo of a printout.",
        ],
      },
      {
        heading: "PDF or Word?",
        paragraphs: [
          "Both usually work. A PDF made from a normal document keeps your layout the same on every screen, and the text can be selected, which is what the software needs. Use Word if the job post asks for it. Whichever you pick, open the file and try to select and copy the text. If you can't, an ATS can't read it either.",
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
    updated: "2026-11-22",
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
        heading: "Why each check matters",
        paragraphs: [
          "A checklist is only useful if you know why each item is there. Here is the short reason behind the three groups.",
        ],
        list: [
          "Format checks: software reads your file as plain text. Columns, tables, icons and graphics can scramble the order or drop text.",
          "Content checks: recruiters often search for job titles and skills. If your words do not match the job post, a search may not find you, and a person skimming will not see the match either.",
          "Contact and file checks: if the software cannot read your email or phone number, or cannot open the file, the rest does not matter.",
        ],
      },
      {
        heading: "The 30-second copy-and-paste test",
        ordered: true,
        paragraphs: [
          "This is the quickest check you can do yourself, and it needs no tool.",
        ],
        list: [
          "Open your resume file.",
          "Select all the text and copy it.",
          "Paste it into a plain notepad.",
          "Read what you get. Is it in the right order? Are the dates next to the right jobs? Are your phone and email there? Is anything missing?",
        ],
      },
      {
        heading: "Fixing the most common failures",
        list: [
          "Text comes out jumbled: this usually means columns, tables or text boxes. Switch to a single-column layout.",
          "Nothing pastes at all: this usually means the file is an image or a scan. Export again from the original document as a PDF with real text.",
          "Phone or email is missing: it was in the header or inside an icon. Move it into the main body as plain text.",
          "Dates are out of order or mixed up: write every date the same way, for example Jun 2023 – Present, and put them on the same line as the role.",
          "Odd symbols in place of bullets: replace fancy bullets with normal round bullets.",
        ],
      },
      {
        heading: "Tailor it for each job in about ten minutes",
        ordered: true,
        paragraphs: [
          "You do not need to rewrite your resume for every application. A short pass is enough.",
        ],
        list: [
          "Read the job post and note the job title, the main tools and the main duties.",
          "Change your summary so it names the job title and your strongest matching skills.",
          "Move the most relevant bullets to the top of each role.",
          "Add any missing skills from the post that you genuinely have.",
          "Run the checklist above once more, then save the file with your name in it.",
        ],
      },
      {
        heading: "A note on scores",
        paragraphs: [
          "ATS checkers, including Lettr's, give a score to help you spot problems. A score is a guide, not a promise. Each company's software works differently, and a human still decides who gets an interview. Use the score to fix real problems, and do not chase 100 by stuffing keywords.",
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
  {
    slug: "how-to-write-llb-in-resume",
    title: "How to write LLB in a resume (with examples)",
    description:
      "The right way to write LLB, B.A. LL.B. or B.Com LL.B. on your resume: spelling, where it goes, how to show a degree you're still studying, bar enrolment and applying abroad.",
    published: "2026-11-14",
    readMinutes: 4,
    intro:
      "LLB is short for Bachelor of Laws. It looks simple, but law resumes often get it slightly wrong: \"L.L.B.\", the five-year degree split into two lines, or \"Advocate\" written before enrolment. Here's how to write it correctly, with examples you can copy.",
    sections: [
      {
        heading: "The correct way to write it",
        paragraphs: [
          "Write LL.B. or LLB. Both are correct; just use the same form everywhere on your resume. Avoid \"L.L.B.\" and \"Llb\", which are common mistakes and look careless to a law firm.",
          "For a five-year integrated degree, write it as one degree with the full name: B.A. LL.B., BBA LL.B. or B.Com LL.B., and add (Hons.) if your degree is an honours degree.",
        ],
      },
      {
        heading: "Where it goes and what to include",
        paragraphs: ["Put it at the top of your Education section, with:"],
        list: [
          "The degree name, exactly as it appears on your marksheet",
          "Your college and university",
          "Start and end years",
          "CGPA or percentage, if it's good",
        ],
      },
      {
        heading: "Examples you can copy",
        list: [
          "B.Com LL.B. (Hons.), [College], [University] | 2020 - 2025 | CGPA 7.8",
          "LL.B. (3 years), [College], [University] | 2022 - 2025",
          "B.A. LL.B. (Hons.), [College], [University] | 4th year, expected to graduate in 2027 | CGPA 8.1",
        ],
        paragraphs: [
          "If you did a three-year LLB after another degree, list both: the LLB first, then your earlier degree below it.",
        ],
      },
      {
        heading: "Still studying? Show the expected year",
        paragraphs: [
          "Write your current year and when you expect to graduate, like the third example above. Recruiters hiring interns and freshers expect this, so don't leave the end date blank.",
        ],
      },
      {
        heading: "Bar enrolment",
        paragraphs: [
          "Once you're enrolled with a State Bar Council, add a line such as \"Enrolled with the Bar Council of Delhi, 2025\". If you've cleared the All India Bar Examination (AIBE), add that too, with the year.",
          "Only call yourself an \"Advocate\" after you're enrolled. Before that, \"Law graduate\" or \"LL.B. student\" is accurate.",
        ],
      },
      {
        heading: "Use it in your profile line too",
        paragraphs: [
          "Mention the degree in the two-line profile at the top, so it's the first thing a recruiter reads: \"B.Com LL.B. graduate with internships in corporate and tax law, looking for an associate role.\"",
        ],
      },
      {
        heading: "Applying abroad",
        paragraphs: [
          "Outside India, write the full name and the country: \"Bachelor of Laws (LL.B.), [University], India\". Don't describe it as a J.D. or as a qualification to practise in that country. Let the employer judge how it compares.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["law-graduate", "accountant", "chartered-accountant"],
  },
  {
    slug: "law-student-resume-format",
    title: "Law student resume format for India (LLB and B.A. LL.B.)",
    description:
      "A one-page resume format for law students and fresh LLB graduates: what to put first, how to show internships, moot courts and research, and what to leave out.",
    published: "2026-11-27",
    readMinutes: 5,
    intro:
      "A law student's resume has little paid experience, so it has to show other proof: internships, moot courts, research and drafting. This is a simple one-page format for B.A. LL.B., BBA LL.B., B.Com LL.B. and three-year LL.B. students applying for internships and first jobs.",
    sections: [
      {
        heading: "The format, top to bottom",
        ordered: true,
        list: [
          "Contact details: name, phone, professional email, city and LinkedIn. No photo, date of birth or father's name.",
          "Profile: two lines saying your degree, year and the area of law you want, for example corporate, litigation or tax.",
          "Education: degree, college, university, years and CGPA or percentage if it is strong.",
          "Internships: courts, advocates, law firms, companies and NGOs, most recent first.",
          "Moot courts, research and publications: where you competed, what you wrote and where it appeared.",
          "Skills: legal research, drafting, and the databases you have used.",
          "Achievements and activities: committees, debates, legal aid clinics, competitions.",
        ],
      },
      {
        heading: "Why internships come before skills",
        paragraphs: [
          "Firms and chambers hiring students look for proof that you have seen real legal work. Two or three short internships tell them more than a long skills list. Give each one the name of the place, the dates and two or three lines on what you did.",
        ],
      },
      {
        heading: "Skills to list (only if true)",
        list: [
          "Legal research on databases you have actually used, such as SCC Online or Manupatra",
          "Drafting: notices, agreements, petitions, replies",
          "Case-law summaries and legal memos",
          "Tools: MS Word, Excel, and any e-filing or case-management software you have used",
        ],
        paragraphs: [
          "Do not list a skill you cannot explain in an interview. A recruiter may ask you to describe what you drafted.",
        ],
      },
      {
        heading: "Sample education and profile lines",
        list: [
          "B.A. LL.B. (Hons.), [College], [University] | 2022 - 2027 | CGPA [your score]",
          "Profile: Third-year B.A. LL.B. student with internships in litigation and corporate law, looking for a summer internship in a law firm.",
        ],
        paragraphs: [
          "The brackets are for your own details. Use the exact degree name from your marksheet.",
        ],
      },
      {
        heading: "Keep it to one page",
        paragraphs: [
          "One page is enough until you have several years of work. Cut school-level achievements first, then anything you cannot discuss in detail. Save it as a PDF with real, selectable text, and avoid tables and graphics so software can read it.",
        ],
      },
    ],
    cta: { label: "Check my law resume for free", href: "/resume-checker" },
    relatedExamples: ["law-graduate"],
  },
  {
    slug: "moot-court-and-internships-on-resume",
    title: "How to write moot courts and legal internships on your resume",
    description:
      "How law students can describe internships, moot court rounds, research papers and legal aid work on a resume, with before-and-after wording you can adapt.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "Most law students list their internships and moots as one-line titles, like \"Intern at XYZ Chambers\". That tells a recruiter where you were, not what you did. This guide shows how to turn each line into a short, honest description.",
    sections: [
      {
        heading: "The pattern for an internship bullet",
        paragraphs: [
          "Start with a verb, say the work, and name the area of law or the document. Only include numbers you can actually back up.",
        ],
        list: [
          "Before: Intern at [Chambers]. After: Drafted two legal notices and prepared case-law summaries for civil matters in the District Court.",
          "Before: Worked on research. After: Researched case law on [topic] using SCC Online and wrote a five-page memo for the partner.",
          "Before: Helped with agreements. After: Reviewed commercial agreements and listed key clauses and risks for the associate.",
        ],
      },
      {
        heading: "How to list a moot court",
        paragraphs: [
          "Give the competition, the year, your role and the result. If you did not win, an honest description still helps.",
        ],
        list: [
          "[Competition name], [Year]: Speaker, reached the quarter-finals; argued for the respondent on [issue].",
          "[Competition name], [Year]: Researcher; wrote the memorial on [topic].",
        ],
      },
      {
        heading: "Research papers and publications",
        paragraphs: [
          "List the title, where it was published or presented and the year. For an unpublished paper, say \"Paper submitted to [journal]\" only if that is true.",
        ],
      },
      {
        heading: "Legal aid and clinic work",
        paragraphs: [
          "Mention legal aid camps, awareness drives and clinic work in one line each, with what you did, such as \"Helped draft applications for [number] beneficiaries at the legal aid clinic.\" Use real numbers only.",
        ],
      },
      {
        heading: "Confidentiality",
        paragraphs: [
          "Never put client names or confidential case details on a resume. Describe the type of work instead: \"a property dispute\" or \"a consumer complaint\".",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["law-graduate"],
  },
  {
    slug: "resume-for-law-firm-applications",
    title: "Resume for law firm applications in India: what firms look for",
    description:
      "How to shape a resume for law firm and chamber applications in India: length, order, wording, and the common mistakes that get law resumes ignored.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "Law firms in India read many resumes that look the same. A clear, accurate one-page resume stands out. Here is how to shape yours for a firm, chamber or in-house legal team.",
    sections: [
      {
        heading: "Match the resume to the practice area",
        paragraphs: [
          "A corporate firm wants to see contracts, due diligence and research. A litigation chamber wants court work, drafting and case management. Read the job post or the firm's website, then bring the matching internships and skills to the top.",
        ],
      },
      {
        heading: "What to put first",
        list: [
          "Your degree and year, written correctly (see our guide on how to write LLB)",
          "Internships in the same practice area",
          "Moots and papers that relate to the role",
          "A short profile that names the area you want",
        ],
      },
      {
        heading: "Common mistakes",
        list: [
          "Writing \"Advocate\" before you are enrolled with a State Bar Council",
          "Writing the degree in different forms on the same page",
          "Listing internships with no description of the work",
          "Putting a photo, date of birth or family details",
          "A resume over one page for a student or fresher",
        ],
      },
      {
        heading: "Send a short cover note",
        paragraphs: [
          "Many firms accept applications by email. Write three or four lines: who you are, why this firm and this practice area, and what you attach. Name the firm correctly and attach the resume as a PDF.",
        ],
      },
      {
        heading: "Check before you send",
        list: [
          "Spelling of every case name, court and firm",
          "Consistent dates and degree names",
          "A professional email address",
          "Real, selectable text in the PDF",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["law-graduate"],
  },
  {
    slug: "ats-resume-requirements",
    title: "ATS resume requirements: what is required and what is a myth",
    description:
      "The practical requirements an applicant tracking system has for your resume file, layout, headings, dates and keywords, with a short fix list if yours fails.",
    published: "2026-11-22",
    readMinutes: 3,
    intro:
      "Applicant tracking systems (ATS) are not mysterious. They need a file they can open, text they can read in order, and headings and dates they can recognise. Here is what that means in practice.",
    sections: [
      {
        heading: "1. A file the software can open",
        paragraphs: [
          "Send a PDF or Word (.docx) file unless the job post says otherwise. Avoid image files, scans and photos of a printout. Avoid password-protected files, because the software cannot open them.",
        ],
        list: [
          "Name the file clearly, for example Asha-Verma-Resume.pdf.",
          "Open your own file and try to select the text. If you can't, the software can't read it either.",
          "Keep the file small enough to upload without trouble.",
        ],
      },
      {
        heading: "2. A single-column layout with real text",
        paragraphs: [
          "Software reads text from top to bottom. Columns, tables and text boxes can mix up the order, so a job title can end up next to the wrong employer. A simple single-column layout is the safest choice.",
        ],
      },
      {
        heading: "3. Standard section headings",
        paragraphs: [
          "Use names the software expects, such as Summary, Experience, Education and Skills. Creative headings like \"My Journey\" or \"What I Bring\" may not be recognised as sections.",
        ],
      },
      {
        heading: "4. Contact details in the main body",
        paragraphs: [
          "Put your name, phone, email and city at the top of the page as plain text. Details placed only in a header, footer or icon are sometimes skipped.",
        ],
      },
      {
        heading: "5. Consistent dates",
        paragraphs: [
          "Write every date in the same style, for example Jun 2023 – Present, and keep it on the same line as the role. This helps the software work out how long you stayed in each job.",
        ],
      },
      {
        heading: "6. Words that match the job",
        paragraphs: [
          "Recruiters often search by job title and skill. Use the same words as the job post where they are true for you, in your summary, skills and bullets. Do not stuff keywords or hide them in white text.",
        ],
      },
      {
        heading: "If you are unsure",
        paragraphs: [
          "Do the copy-and-paste test: select all the text in your file, paste it into a notepad and read it. If it is in the right order and nothing is missing, you have met most of these requirements. Remember that each company's system is different and a person still makes the final decision.",
        ],
      },
      {
        heading: "Common myths",
        list: [
          "Myth: you need a score of 100. A score is a guide to spot problems, not a pass mark every company uses.",
          "Myth: a plain resume is a bad resume. A simple layout is easier for software and for people to read.",
          "Myth: more keywords always help. Keywords that are not backed up by your experience hurt you in the interview.",
          "Myth: a PDF always fails. A PDF with real, selectable text is normally fine.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["software-engineer", "accountant", "data-analyst"],
  },
  {
    slug: "resume-for-1-2-years-experience",
    title: "Resume for 1–2 years of experience: format and examples",
    description:
      "How to write a resume with one or two years of experience: what goes first, how to turn your first job into strong bullets, and what to cut from your fresher resume.",
    published: "2026-11-22",
    readMinutes: 3,
    intro:
      "With one or two years of work behind you, you are no longer a fresher, but you do not have a long career yet. Your resume should lead with your job, keep education short and show results from the work you actually did.",
    sections: [
      {
        heading: "The order that works",
        ordered: true,
        list: [
          "Header with contact details",
          "Summary of two or three lines naming your role and strongest skills",
          "Experience, with your current job first",
          "Skills",
          "Projects, only if they add something your job does not show",
          "Education, kept to one or two lines",
        ],
      },
      {
        heading: "Move experience above education",
        paragraphs: [
          "Once you have a job, recruiters want to see it first. Keep marks and coursework only if they help for a specific role. Class 10 and 12 details are usually not needed on the resume any more, but some employers still ask for them on application forms, so keep them handy.",
        ],
      },
      {
        heading: "Write a short summary",
        paragraphs: [
          "Name your role, your years of experience and two or three skills that match the job. For example: Data analyst with 1.5 years of experience building dashboards in Power BI and writing SQL for a retail team. This is an example of the shape, so use your own facts.",
        ],
      },
      {
        heading: "Turn duties into results",
        paragraphs: [
          "A duty says what you were asked to do. A result says what changed because of it. For each bullet, start with a verb, name the tool or method and add a number or scale if you honestly have one.",
        ],
        list: [
          "Duty: Responsible for weekly reports.",
          "Better: Built weekly sales reports in Excel for 4 regional managers, replacing a manual process.",
          "If you have no number, describe the scale: how many people used it, how often, how big.",
        ],
      },
      {
        heading: "Use your internships and projects wisely",
        paragraphs: [
          "If your internship is your only other experience, keep it below your job in a short entry. Keep one or two projects only if they show a skill the job asks for. Drop college projects that repeat what your job already shows.",
        ],
      },
      {
        heading: "Keep it to one page",
        paragraphs: [
          "One page is the norm at this stage. If it spills over, cut old coursework, repeated bullets and skills you cannot talk about.",
        ],
      },
      {
        heading: "Tailor it before you apply",
        paragraphs: [
          "Read the job post, note the title and main tools, then adjust your summary and move the most relevant bullets to the top. A short pass is enough.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["data-analyst", "business-analyst", "software-engineer"],
  },
  {
    slug: "explain-gap-or-short-job-on-resume",
    title: "How to explain a career gap or a very short job on your resume",
    description:
      "Honest ways to handle a gap between jobs or a job you left after a few months: what to write on the resume, what to say in the interview, and what not to do.",
    published: "2026-11-22",
    readMinutes: 3,
    intro:
      "A gap or a very short job worries many people, but it is common and usually easy to handle. The rule is simple: be honest, keep it brief and move the reader quickly to what you can do now.",
    sections: [
      {
        heading: "Never hide it by changing dates",
        paragraphs: [
          "Do not stretch dates or invent a role to cover a gap. Background checks and interviews often bring it out, and being caught is worse than the gap itself.",
        ],
      },
      {
        heading: "Short job: show it, keep it short",
        paragraphs: [
          "You can list a job you held for a few months. Give the title, company and dates, and write one or two honest bullets about what you did or learned. Be careful about leaving it off. Past jobs often show up anyway in background checks and EPF service history, and application forms that ask for your full work history must be answered in full.",
        ],
      },
      {
        heading: "Gap: say what you did",
        paragraphs: [
          "If the gap is a few months, many people simply leave it and explain it in the interview. For a longer gap, add a short line in the resume and keep it factual.",
        ],
        list: [
          "Career break, Jan 2025 – Aug 2025: family responsibilities.",
          "Career break, 2024: full-time exam preparation.",
          "Upskilling, Mar 2025 – Aug 2025: completed courses in SQL and Excel.",
        ],
      },
      {
        heading: "Prepare a 20-second answer",
        paragraphs: [
          "In the interview, give a calm, short answer: what happened, what you did in that time, and why you are ready now. Do not over-explain or blame anyone. Then bring the conversation back to the role.",
        ],
      },
      {
        heading: "What to avoid",
        list: [
          "Fake jobs, stretched dates or made-up freelancing",
          "Long apologies on the resume",
          "Criticising a former employer",
          "Leaving a gap unexplained in an interview when asked directly",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["returning-after-career-break"],
  },
  {
    slug: "ai-engineer-resume-example",
    title: "AI engineer resume: what to include, with a sample outline",
    description:
      "How to write an AI or machine learning engineer resume: what to put first, how to describe models and projects honestly, and which skills and results recruiters look for.",
    published: "2026-11-22",
    readMinutes: 3,
    intro:
      "AI and machine learning recruiters want to see what you built, with what tools, and what it achieved. A clear resume with real projects and honest results beats a long list of buzzwords.",
    sections: [
      {
        heading: "What goes first",
        paragraphs: [
          "Lead with a short summary and your work experience. If you are early in your career, put one or two strong projects right after it. Keep education to a line or two.",
        ],
      },
      {
        heading: "Sample summary (made-up)",
        paragraphs: [
          "AI engineer with 1.5 years of experience building and deploying NLP models in Python. Comfortable with PyTorch, scikit-learn and REST APIs. Looking for an applied ML role. Use this only as a shape and replace every detail with your own.",
        ],
      },
      {
        heading: "Describe projects the right way",
        paragraphs: [
          "For each project, say the problem, the data, the method and the result. Name the tools you used, and give a number only if you measured it.",
        ],
        list: [
          "Problem: classify customer support tickets by topic.",
          "Method: fine-tuned a small transformer model on labelled tickets.",
          "Result: improved accuracy over the earlier rule-based approach, measured on a held-out set.",
          "Add a link to code or a demo if you can share it.",
        ],
      },
      {
        heading: "Skills to list, only if you have them",
        list: [
          "Languages: Python, SQL",
          "Libraries: PyTorch or TensorFlow, scikit-learn, pandas, NumPy",
          "Tools: Git, Docker, a cloud platform you have used",
          "Areas: NLP, computer vision, recommendation, LLM applications",
          "Practice: evaluation, data cleaning, deployment basics",
        ],
      },
      {
        heading: "Be honest about your role",
        paragraphs: [
          "Say whether you built, fine-tuned, evaluated or deployed a model. If you used a pre-trained model or an API, say so. Interviewers will ask, and honest answers build trust.",
        ],
      },
      {
        heading: "Mistakes to avoid",
        list: [
          "Listing every library you have opened once",
          "Vague bullets like \"worked on machine learning\"",
          "Results with no way to check them",
          "Projects that are only tutorial copies without your own change",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["data-analyst", "software-engineer", "business-analyst"],
  },
  {
    slug: "legal-assistant-resume-example",
    title: "Legal assistant resume: what to include for freshers and early-career candidates",
    description:
      "How to write a legal assistant resume: what to include, how to describe drafting, research and court work, and sample wording for law firms and in-house teams.",
    published: "2026-11-22",
    readMinutes: 3,
    intro:
      "Law firms and legal teams look for accuracy, drafting ability and reliability. A clear one-page resume that shows what legal work you have actually done will help you stand out.",
    sections: [
      {
        heading: "What to include, in order",
        ordered: true,
        list: [
          "Header with contact details and city",
          "Short profile of two or three lines",
          "Experience and internships, with the most recent first",
          "Education, including your law degree and year",
          "Skills and software",
          "Moot courts, papers and certifications",
        ],
      },
      {
        heading: "Sample profile (made-up)",
        paragraphs: [
          "Law graduate (or diploma holder) with internship experience in drafting, legal research and court filing support. Comfortable with MS Word, case-law databases and client communication. Seeking a legal assistant role at a law firm. Use this as a shape and change every detail to match your own experience.",
        ],
      },
      {
        heading: "Describe legal work in plain terms",
        paragraphs: [
          "Say what you drafted, researched or supported, and what it was used for. Do not share confidential client details.",
        ],
        list: [
          "Drafted first versions of notices and agreements for review by the supervising advocate.",
          "Researched case law on a given issue and prepared a short note for the team.",
          "Maintained the case diary and tracked hearing dates for active matters.",
        ],
      },
      {
        heading: "Skills that fit the role",
        list: [
          "Legal drafting and proofreading",
          "Legal research on case-law databases you have used",
          "MS Word and Excel",
          "Document filing and record keeping",
          "English and Hindi, or the regional languages you work in",
        ],
      },
      {
        heading: "Moot courts, papers and certificates",
        paragraphs: [
          "List the competitions and papers with your role and the year. If you were published or ranked, say so only if it is true and can be checked.",
        ],
      },
      {
        heading: "Keep it accurate and short",
        paragraphs: [
          "Legal employers notice mistakes. Check names, dates and spellings, and keep the resume to one page.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["law-graduate"],
  },
  {
    slug: "resume-format-for-experienced-professionals",
    title: "Resume format for experienced professionals in India (3+ years)",
    description:
      "The resume format for experienced candidates in India: section order, how long it should be, how to write a summary and achievements, and what to remove.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "With three or more years of work, your resume should show your career in a few seconds: where you work now, what you own and what you have delivered. This is the format and order that works for experienced applicants in India.",
    sections: [
      {
        heading: "The section order",
        ordered: true,
        list: [
          "Header: name, phone, email, city and LinkedIn link",
          "Summary of three or four lines",
          "Key skills, grouped (tools, domain, people skills)",
          "Work experience, latest job first",
          "Projects or certifications, only if they help for this role",
          "Education, in one or two lines",
        ],
      },
      {
        heading: "How long should it be?",
        paragraphs: [
          "One page is fine up to about five years of experience if everything on it is useful. Two pages are normal for longer careers or senior roles. Do not stretch to a second page with filler, and do not squeeze text so small that it is hard to read.",
        ],
      },
      {
        heading: "Write a summary that names your level",
        paragraphs: [
          "State your role, years of experience, the kind of company or domain you work in and two or three strengths that match the job. Example shape: Operations manager with 7 years of experience in logistics, managing teams of up to 20 and vendor contracts. Use your own facts.",
        ],
      },
      {
        heading: "Show achievements, not duties",
        paragraphs: [
          "Each job needs three to six bullets. Start with the biggest result. Use numbers only when you can stand behind them in an interview: team size, volume, time saved, targets met.",
        ],
        list: [
          "Duty: Managed the support team.",
          "Better: Led a team of 12 support executives and brought average reply time down from two days to one.",
          "If you cannot give a number, name the scale: customers, cities, budget, tools or people involved.",
        ],
      },
      {
        heading: "Show growth inside one company",
        paragraphs: [
          "If you were promoted, list each title with its own dates under the same company. Recruiters like to see progress, and it helps ATS software read your titles correctly.",
        ],
      },
      {
        heading: "What to remove",
        list: [
          "Class 10 and 12 marks, unless a form asks for them",
          "Objective statements such as 'seeking a challenging position'",
          "Photo, date of birth, father's name and marital status",
          "Jobs older than about 15 years, or keep them as one short line each",
          "Skills you could not discuss for two minutes",
        ],
      },
      {
        heading: "Gaps and job changes",
        paragraphs: [
          "Short stints and gaps are common. Keep dates honest and see our guide on explaining a gap or a very short job.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["operations-manager", "product-manager", "business-analyst", "project-manager-canada"],
  },
  {
    slug: "resume-format-for-btech-freshers",
    title: "Resume format for B.Tech and engineering freshers in India",
    description:
      "A one-page resume format for B.Tech and engineering freshers: what to put first, how to describe projects and internships, and how to list skills for campus and off-campus jobs.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "Engineering freshers usually have the same marks and the same college projects as hundreds of other applicants. What sets a resume apart is clear projects, honest skills and a layout that software can read. Here is the format.",
    sections: [
      {
        heading: "The section order",
        ordered: true,
        list: [
          "Header: name, phone, email, city, LinkedIn and GitHub link if your code is public",
          "Two-line summary stating your branch and the kind of role you want",
          "Education, with degree, college, years and CGPA or percentage",
          "Projects, two or three of your best",
          "Internships or training, if any",
          "Technical skills, grouped by type",
          "Certifications and achievements",
        ],
      },
      {
        heading: "Education goes first for freshers",
        paragraphs: [
          "With no job yet, your degree is your strongest line. Write the degree, branch, college, university, years and your CGPA or percentage. Add Class 12 and Class 10 only if the job post or the portal asks for them.",
        ],
      },
      {
        heading: "Describe projects so a recruiter can follow them",
        paragraphs: [
          "For each project give the title, the tools you used and two or three bullets: the problem, what you built and the result. Say clearly which part you did if it was a team project.",
        ],
        list: [
          "Weak: Made a library management system.",
          "Better: Built a library management system in Java and MySQL with login, book search and fine calculation; used by 30 students in a trial at college.",
          "Only claim a result such as a trial or a user count if it really happened.",
        ],
      },
      {
        heading: "List skills honestly and by group",
        paragraphs: [
          "Group skills so they are easy to scan, for example Languages, Tools and Core subjects. List only what you can answer questions on. A long list of tools you touched once will be tested in the interview.",
        ],
      },
      {
        heading: "Internships, training and certificates",
        paragraphs: [
          "Write the company, role and dates, then two bullets on what you did. Short online courses can go in one line each. Keep only those related to the role you want.",
        ],
      },
      {
        heading: "Keep the layout simple for ATS",
        list: [
          "One page, single column",
          "Standard headings such as Education, Projects and Skills",
          "No tables, icons, skill bars or photo",
          "Save as PDF unless the portal asks for Word",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["campus-placement-software-engineer", "mechanical-engineer-fresher", "software-engineer"],
  },
  {
    slug: "resume-format-for-commerce-and-mba-freshers",
    title: "Resume format for B.Com, BBA and MBA freshers in India",
    description:
      "A resume format for commerce, BBA and MBA freshers: how to show internships, academic projects and tools like Excel and Tally, for roles in accounts, finance, marketing and HR.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "Commerce and management freshers are often hired for accounts, finance, sales, marketing and HR roles. Recruiters look for practical tools, internships and clear, accurate writing. Here is how to lay it out.",
    sections: [
      {
        heading: "The section order",
        ordered: true,
        list: [
          "Header: name, phone, email, city and LinkedIn link",
          "Two-line summary naming your degree and the role you want",
          "Education, with specialisation and marks or CGPA",
          "Internships and live projects",
          "Skills and tools",
          "Certifications, positions of responsibility and achievements",
        ],
      },
      {
        heading: "Choose the role, then shape the resume",
        paragraphs: [
          "A resume for an accounts role and one for a marketing role should not read the same. Pick the role you are applying for and move the matching internship, project and tools to the top.",
        ],
        list: [
          "Accounts and finance: Tally, Excel, GST filing practice, bank reconciliation, MIS reports",
          "Sales and marketing: lead generation, campaign support, social media, CRM tools, presentations",
          "HR: recruitment coordination, screening, onboarding, records and Excel",
        ],
      },
      {
        heading: "Make internships and projects count",
        paragraphs: [
          "Write the organisation, your role, the duration and two or three bullets with a verb, the work and the tool. If your internship was short, say what you handled yourself.",
        ],
        list: [
          "Weak: Worked in the accounts department.",
          "Better: Prepared monthly bank reconciliation statements in Excel for a small trading firm during a 6-week internship.",
          "MBA freshers can add a summer internship project with its objective, method and finding, using only facts you can discuss.",
        ],
      },
      {
        heading: "Tools recruiters search for",
        paragraphs: [
          "List the tools you have actually used, such as Excel (say which functions), Tally, a CRM, PowerPoint or a reporting tool. Recruiters and ATS software search by tool name, so use the same names as the job post.",
        ],
      },
      {
        heading: "Use positions of responsibility",
        paragraphs: [
          "Club lead, event coordinator or class representative roles show teamwork and ownership. Keep two or three, each with one line on what you organised and for how many people.",
        ],
      },
      {
        heading: "Keep it to one page",
        paragraphs: [
          "One page, clean headings, no photo or decorative layout. Check spelling and dates twice. Finance and HR recruiters notice mistakes quickly.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["bcom-fresher-accounts", "mba-fresher-marketing", "hr-executive", "accountant"],
  },
  {
    slug: "resignation-letter-format-india",
    title: "Resignation letter format for India: sample and what to include",
    description:
      "The standard resignation letter format for India: subject line, what to include, a short sample you can adapt, and the mistakes to avoid.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "A resignation letter is a short, polite, formal record that you are leaving. HR keeps it on file, so clear and neutral is better than long and emotional. Here is the format and a sample you can adapt.",
    sections: [
      {
        heading: "What to include",
        list: [
          "Date",
          "To: your manager's name and designation (and HR if your company asks)",
          "Subject: Resignation from the post of [your job title]",
          "A clear statement that you are resigning",
          "Your last working day, based on your notice period",
          "A short thank-you",
          "An offer to help with the handover",
          "Your name and signature",
        ],
      },
      {
        heading: "A short sample",
        paragraphs: [
          "Subject: Resignation from the post of [Job title]",
          "Dear [Manager's name],",
          "I am writing to resign from my position as [Job title] at [Company name]. As per my notice period of [number] days, my last working day will be [date].",
          "Thank you for the opportunities and support during my time here. I will complete my pending work and help hand over my responsibilities to the person you choose.",
          "Yours sincerely,",
          "[Your name], [Employee ID if you have one]",
          "These are placeholders, so fill in your own details.",
        ],
      },
      {
        heading: "Keep it short and neutral",
        paragraphs: [
          "You do not need to give a detailed reason. One line is enough, or none. Do not criticise the company or colleagues; the letter stays in your file.",
        ],
      },
      {
        heading: "Send it the right way",
        paragraphs: [
          "Follow your company's process. Many companies want the letter by email to your manager with HR in copy, and some also want a signed copy. Speak to your manager first if you can, so the letter is not a surprise.",
        ],
      },
      {
        heading: "Mistakes to avoid",
        list: [
          "Writing a long story about why you are unhappy",
          "Leaving out the last working day",
          "Quoting a notice period without checking your contract",
          "Sending it before you have a written offer from the new employer",
        ],
      },
      {
        heading: "Notice period",
        paragraphs: [
          "Check your offer letter or employment contract for the notice period and any buy-out clause. This guide is general information, not legal advice.",
        ],
      },
    ],
    cta: { label: "Write my resignation letter", href: "/resignation-letters" },
  },
  {
    slug: "resignation-letter-for-one-month-notice",
    title: "Resignation letter for a one-month notice period (with sample)",
    description:
      "How to write a resignation letter when your notice period is one month: counting the last working day, a sample letter and how to hand over.",
    published: "2026-11-27",
    readMinutes: 3,
    intro:
      "A one-month notice period is common in India. Your letter states the date you resign and the last working day that follows from it. Here is how to write it and a sample to adapt.",
    sections: [
      {
        heading: "Work out the last working day",
        paragraphs: [
          "Count from the date you give the letter, not from the date you tell your manager informally. If you resign on [date], one month later is your last working day, unless your contract counts days or has other rules. Ask HR to confirm the date in writing.",
        ],
      },
      {
        heading: "A sample letter",
        paragraphs: [
          "Subject: Resignation from the post of [Job title]",
          "Dear [Manager's name],",
          "Please accept this letter as formal notice of my resignation from the position of [Job title] at [Company name]. As per my one-month notice period, my last working day will be [date].",
          "I am grateful for the learning and support I have received. During my notice period I will complete my pending tasks and prepare a handover for my team.",
          "Yours sincerely,",
          "[Your name]",
          "These are placeholders, so use your own details.",
        ],
      },
      {
        heading: "Plan the handover",
        list: [
          "List your open tasks, deadlines and who needs to know",
          "Write down passwords or access that must be transferred, following your company's security rules",
          "Offer to train a replacement if one is hired",
          "Keep a copy of your own documents that you are allowed to keep",
        ],
      },
      {
        heading: "If you want to leave earlier",
        paragraphs: [
          "You can ask for an earlier last day or a notice period buy-out, but the company decides. Put the request in a separate polite note or email, not inside the resignation letter.",
        ],
      },
      {
        heading: "Before you submit",
        paragraphs: [
          "Check your offer letter or employment contract for the notice period and any buy-out clause. This guide is general information, not legal advice.",
        ],
      },
    ],
    cta: { label: "Write my resignation letter", href: "/resignation-letters" },
  },
  {
    slug: "resignation-letter-immediate-effect",
    title: "Resignation letter with immediate effect: when and how to write it",
    description:
      "How to write a resignation letter with immediate effect: what it means, why you should check your contract first, a sample and a polite way to ask.",
    published: "2026-11-27",
    readMinutes: 3,
    intro:
      "Resigning with immediate effect means you want to leave at once instead of serving a notice period. The company may not accept it, so the tone and the request matter. Here is how to write it carefully.",
    sections: [
      {
        heading: "Check your contract first",
        paragraphs: [
          "Most employment contracts require a notice period. Leaving without serving it can lead to a deduction of pay in lieu or affect your experience letter. Read the clause before you write, and speak to HR if you are unsure.",
        ],
      },
      {
        heading: "Ask, do not announce",
        paragraphs: [
          "A letter that says you are leaving today may be refused. A better approach is to resign, explain briefly that you need to leave quickly, and ask whether the company can release you early or accept a buy-out.",
        ],
      },
      {
        heading: "A sample letter",
        paragraphs: [
          "Subject: Resignation from the post of [Job title] and request for early release",
          "Dear [Manager's name],",
          "I am resigning from my position as [Job title] at [Company name]. Due to [short, honest reason, or leave it out], I request that you release me from my duties with effect from [date], or as early as possible.",
          "I am willing to discuss a notice period buy-out and to complete a handover before I go.",
          "Yours sincerely,",
          "[Your name]",
          "These are placeholders. Only state a reason that is true.",
        ],
      },
      {
        heading: "Be ready to compromise",
        list: [
          "Offer a short handover period",
          "Offer to pay the notice period buy-out if your contract allows it",
          "Ask HR to confirm in writing what dues and documents you will receive",
        ],
      },
      {
        heading: "Before you submit",
        paragraphs: [
          "Check your offer letter or employment contract for the notice period and any buy-out clause. This guide is general information, not legal advice.",
        ],
      },
    ],
    cta: { label: "Write my resignation letter", href: "/resignation-letters" },
  },
  {
    slug: "resignation-letter-for-better-offer",
    title: "Resignation letter when you have a better job offer",
    description:
      "How to resign politely when you have a new job: what to say about the reason, a short sample and how to handle a counter-offer.",
    published: "2026-11-27",
    readMinutes: 3,
    intro:
      "Leaving for a better opportunity is the most common reason to resign. Your letter does not need to mention the new job or salary. Keep it short, thankful and professional.",
    sections: [
      {
        heading: "Do these before you resign",
        list: [
          "Get the offer in writing and read the joining date and conditions",
          "Check your notice period so your last day and the new joining date fit",
          "Check whether your contract has a non-compete or confidentiality clause",
        ],
      },
      {
        heading: "What to say about the reason",
        paragraphs: [
          "You can say you are leaving to take up another opportunity, or give no reason. You do not have to name the company or the pay. Avoid comparing the two employers.",
        ],
      },
      {
        heading: "A sample letter",
        paragraphs: [
          "Subject: Resignation from the post of [Job title]",
          "Dear [Manager's name],",
          "I am resigning from my position as [Job title] at [Company name] to take up another opportunity. My last working day will be [date], as per my notice period.",
          "Thank you for your guidance and for the chance to work on [project or team]. I will make sure my work is handed over properly.",
          "Yours sincerely,",
          "[Your name]",
          "These are placeholders, so use your own details.",
        ],
      },
      {
        heading: "If you get a counter-offer",
        paragraphs: [
          "Think before you accept. Ask yourself why you wanted to leave and whether a higher salary changes that. Whatever you choose, thank your manager and respond politely.",
        ],
      },
      {
        heading: "Before you submit",
        paragraphs: [
          "Check your offer letter or employment contract for the notice period and any buy-out clause. This guide is general information, not legal advice.",
        ],
      },
    ],
    cta: { label: "Write my resignation letter", href: "/resignation-letters" },
  },
  {
    slug: "resignation-letter-for-health-or-family-reasons",
    title: "Resignation letter for health or family reasons (with sample)",
    description:
      "How to write a resignation letter for health or family reasons: how much to share, a respectful sample and what to ask HR about final dues.",
    published: "2026-11-27",
    readMinutes: 3,
    intro:
      "Sometimes you need to leave because of your own health or a family situation. You do not have to share details. A short, honest line is enough, and you can ask about the handover and final dues.",
    sections: [
      {
        heading: "Share only what you want to",
        paragraphs: [
          "A phrase such as 'for personal reasons' or 'for health reasons' is enough. Employers do not need a diagnosis in a resignation letter, though some may ask for documents if you also request leave.",
        ],
      },
      {
        heading: "A sample letter",
        paragraphs: [
          "Subject: Resignation from the post of [Job title]",
          "Dear [Manager's name],",
          "I am sorry to inform you that I must resign from my position as [Job title] at [Company name] because of [family reasons / health reasons]. My last working day will be [date].",
          "I am thankful for the support I have received. I will do my best to complete my work and hand over my tasks before I leave.",
          "Yours sincerely,",
          "[Your name]",
          "These are placeholders. Share only as much as you are comfortable with.",
        ],
      },
      {
        heading: "Ask about leave before you resign",
        paragraphs: [
          "If you need time rather than a permanent exit, ask whether your company allows leave without pay or a break. It may be a better option than resigning.",
        ],
      },
      {
        heading: "Ask HR about the final steps",
        list: [
          "Last working day and notice period terms",
          "Full and final settlement date",
          "Relieving letter and experience certificate",
          "Provident fund and any insurance cover after you leave",
        ],
      },
      {
        heading: "Before you submit",
        paragraphs: [
          "Check your offer letter or employment contract for the notice period and any buy-out clause. This guide is general information, not legal advice.",
        ],
      },
    ],
    cta: { label: "Write my resignation letter", href: "/resignation-letters" },
  },
  {
    slug: "synonyms-for-managed-on-a-resume",
    title: "Synonyms for \u201cmanaged\u201d on a resume (with examples)",
    description:
      "Stronger words to use instead of \u201cmanaged\u201d on a resume, with before and after examples. Use only words that are true for your work.",
    published: "2026-11-27",
    readMinutes: 3,
    intro:
      "\u201cManaged\u201d is the most common verb on resumes and says little. These alternatives show how you managed, and what changed.",
    sections: [
      {
        heading: "Why change the word",
        paragraphs: [
          "Recruiters and ATS software read dozens of resumes. Repeating the same verb in every bullet makes your work look flat. A precise verb shows what you actually did.",
        ],
      },
      {
        heading: "Words you can use instead",
        list: [
          "Led: for a team you guided day to day",
          "Coordinated: for people, schedules or vendors you kept on track",
          "Supervised: for direct supervision of staff or workers",
          "Oversaw: for a process or area you were accountable for",
          "Directed: for senior roles with set targets",
          "Administered: for systems, budgets or records you ran",
          "Organised: for events, files or workloads you put in order",
        ],
      },
      {
        heading: "Before and after",
        list: [
          "Before: Managed a team of 8.",
          "After: Led a team of 8 support executives and cut average reply time from two days to one.",
          "Before: Managed vendors.",
          "After: Coordinated 6 vendors and kept deliveries on schedule each month.",
        ],
      },
      {
        heading: "Use only what is true",
        paragraphs: [
          "A stronger verb must still describe your real role. If you supported a project, say supported, not led. Interviewers will ask you about every word.",
        ],
      },
      {
        heading: "Check the rest of your resume",
        paragraphs: [
          "After you change the verbs, run your resume through a free ATS check to see how it reads as plain text.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
  },
  {
    slug: "synonyms-for-led-on-a-resume",
    title: "Synonyms for \u201cled\u201d on a resume (with examples)",
    description:
      "Stronger words to use instead of \u201cled\u201d on a resume, with before and after examples. Use only words that are true for your work.",
    published: "2026-11-27",
    readMinutes: 3,
    intro:
      "\u201cLed\u201d is a strong verb, but it loses force when every bullet uses it. Here are accurate alternatives for different kinds of leadership.",
    sections: [
      {
        heading: "Why change the word",
        paragraphs: [
          "Recruiters and ATS software read dozens of resumes. Repeating the same verb in every bullet makes your work look flat. A precise verb shows what you actually did.",
        ],
      },
      {
        heading: "Words you can use instead",
        list: [
          "Headed: when you were the named head of a team or project",
          "Guided: when you mentored people without being their manager",
          "Spearheaded: when you started and drove an initiative",
          "Mentored: for coaching juniors or interns",
          "Chaired: for committees and meetings",
          "Launched: for something new you started",
          "Trained: for teaching people a process or tool",
        ],
      },
      {
        heading: "Before and after",
        list: [
          "Before: Led a project.",
          "After: Spearheaded a six-month migration of 12 reports from Excel to Power BI.",
          "Before: Led new hires.",
          "After: Trained 5 new hires on the refund process in their first two weeks.",
        ],
      },
      {
        heading: "Use only what is true",
        paragraphs: [
          "A stronger verb must still describe your real role. If you supported a project, say supported, not led. Interviewers will ask you about every word.",
        ],
      },
      {
        heading: "Check the rest of your resume",
        paragraphs: [
          "After you change the verbs, run your resume through a free ATS check to see how it reads as plain text.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
  },
  {
    slug: "synonyms-for-responsible-for-on-a-resume",
    title: "Synonyms for \u201cresponsible for\u201d on a resume (with examples)",
    description:
      "Stronger words to use instead of \u201cresponsible for\u201d on a resume, with before and after examples. Use only words that are true for your work.",
    published: "2026-11-27",
    readMinutes: 3,
    intro:
      "\u201cResponsible for\u201d describes a duty, not a result. Replace it with an action verb and, where you honestly can, show the outcome.",
    sections: [
      {
        heading: "Why change the word",
        paragraphs: [
          "Recruiters and ATS software read dozens of resumes. Repeating the same verb in every bullet makes your work look flat. A precise verb shows what you actually did.",
        ],
      },
      {
        heading: "Words you can use instead",
        list: [
          "Handled: for tasks you did every day",
          "Owned: for work you were fully accountable for",
          "Prepared: for reports, documents or analyses",
          "Delivered: for completed projects or outputs",
          "Maintained: for systems, records or accounts",
          "Processed: for invoices, claims or orders",
          "Resolved: for problems and customer issues",
        ],
      },
      {
        heading: "Before and after",
        list: [
          "Before: Responsible for monthly reports.",
          "After: Prepared monthly sales reports in Excel for 4 regional managers.",
          "Before: Responsible for customer complaints.",
          "After: Resolved about 30 customer complaints a week and escalated unresolved cases to the team lead.",
        ],
      },
      {
        heading: "Use only what is true",
        paragraphs: [
          "A stronger verb must still describe your real role. If you supported a project, say supported, not led. Interviewers will ask you about every word.",
        ],
      },
      {
        heading: "Check the rest of your resume",
        paragraphs: [
          "After you change the verbs, run your resume through a free ATS check to see how it reads as plain text.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
  },
  {
    slug: "synonyms-for-helped-on-a-resume",
    title: "Synonyms for \u201chelped\u201d on a resume (with examples)",
    description:
      "Stronger words to use instead of \u201chelped\u201d on a resume, with before and after examples. Use only words that are true for your work.",
    published: "2026-11-27",
    readMinutes: 3,
    intro:
      "\u201cHelped\u201d hides your real contribution. These verbs say what you actually did to support a team, a customer or a project.",
    sections: [
      {
        heading: "Why change the word",
        paragraphs: [
          "Recruiters and ATS software read dozens of resumes. Repeating the same verb in every bullet makes your work look flat. A precise verb shows what you actually did.",
        ],
      },
      {
        heading: "Words you can use instead",
        list: [
          "Supported: for ongoing help to a team or manager",
          "Assisted: for tasks done under someone's direction",
          "Contributed: for a clear part of a bigger result",
          "Collaborated: for work done with others as equals",
          "Enabled: for something that let others work faster",
          "Advised: for giving recommendations",
          "Facilitated: for running or arranging sessions",
        ],
      },
      {
        heading: "Before and after",
        list: [
          "Before: Helped the sales team.",
          "After: Supported a 5-person sales team by preparing weekly lead lists and follow-up reminders.",
          "Before: Helped with a website project.",
          "After: Contributed to a website redesign by writing the copy for 8 pages.",
        ],
      },
      {
        heading: "Use only what is true",
        paragraphs: [
          "A stronger verb must still describe your real role. If you supported a project, say supported, not led. Interviewers will ask you about every word.",
        ],
      },
      {
        heading: "Check the rest of your resume",
        paragraphs: [
          "After you change the verbs, run your resume through a free ATS check to see how it reads as plain text.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
  },
  {
    slug: "resume-format-usa",
    title: "Resume format for the USA: length, sections and what to leave out",
    description:
      "The US resume format: one page for most people, no photo or age, reverse-chronological order, and a plain layout that applicant tracking systems read.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "A US resume is short, factual and focused on results. Employers expect a clean one-page document for most careers. Here is the format, with the details that surprise applicants from other countries.",
    sections: [
      {
        heading: "The section order",
        ordered: true,
        list: [
          "Header: name, phone, email, city and state, LinkedIn",
          "Summary of two or three lines",
          "Work experience, latest first",
          "Skills",
          "Education",
          "Certifications or projects, if they help",
        ],
      },
      {
        heading: "Length",
        paragraphs: [
          "One page is the usual advice for students and early careers. Two pages can be fine for ten or more years of experience or senior roles. Use US Letter size (8.5 by 11 inches) when you export.",
        ],
      },
      {
        heading: "Leave these out",
        list: [
          "Photo",
          "Age, date of birth, marital status or religion",
          "Full home address; city and state are enough",
          "References; write them on a separate page only if asked",
          "An objective line that only says you want a good job",
        ],
      },
      {
        heading: "Use numbers and tools",
        paragraphs: [
          "US recruiters like results: sales, savings, volume, time saved, team size. Use only numbers you can explain. Name the tools, such as Excel, Salesforce or Python, using the same words as the job post.",
        ],
      },
      {
        heading: "Resume or CV?",
        paragraphs: [
          "In the USA, a resume is the normal job document. A CV is longer and used mainly for academic, research and some medical roles.",
        ],
      },
      {
        heading: "Keep it ATS friendly",
        list: [
          "Single column, standard headings",
          "No tables, text boxes or icons",
          "Save as PDF or Word, as the job post asks",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["software-engineer-usa", "customer-service-representative-usa"],
  },
  {
    slug: "cover-letter-format-usa",
    title: "Cover letter format for US applications (with a sample)",
    description:
      "How to format a US cover letter: structure, length, opening line, a short sample and common mistakes. Written for applicants applying to US jobs.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "A US cover letter is a short, confident letter that connects your experience to one job. It is usually half a page to one page. Here is the structure and a sample you can adapt.",
    sections: [
      {
        heading: "The structure",
        ordered: true,
        list: [
          "Your name and contact details at the top",
          "Date",
          "Hiring manager's name, if you can find it, and the company",
          "Opening: the job you want and why you fit, in two sentences",
          "Middle: one or two short paragraphs with specific results that match the job",
          "Closing: thanks and a clear next step",
          "Sign-off: Sincerely, and your name",
        ],
      },
      {
        heading: "A short sample",
        paragraphs: [
          "Dear [Hiring manager's name],",
          "I am applying for the [Job title] role at [Company]. In my current role at [Company name] I [one result that matches the job], and I would like to bring the same focus to your team.",
          "[One more specific example: a project, a number, a tool used.]",
          "Thank you for your time. I would welcome the chance to talk about how I can help [Company] with [goal from the job post].",
          "Sincerely,",
          "[Your name]",
          "These are placeholders, so use your own facts.",
        ],
      },
      {
        heading: "Length and tone",
        paragraphs: [
          "Keep it to one page. Write in plain, direct English. Avoid copying your resume line for line; add the story behind two or three points.",
        ],
      },
      {
        heading: "Mistakes to avoid",
        list: [
          "Starting with 'To whom it may concern' when a name is available",
          "Writing about what the job will do for you instead of what you bring",
          "Sending the same letter to every company",
          "Spelling the company or the hiring manager's name wrongly",
        ],
      },
    ],
    cta: { label: "Write my cover letter", href: "/builder/new?tab=cover-letter" },
  },
  {
    slug: "how-to-use-an-ai-resume-builder",
    title: "How to use an AI resume builder without making things up",
    description:
      "A practical way to use an AI resume builder: give it real facts, tailor to the job, check every line and keep control of the final text.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "An AI resume builder can save time, but it can also write confident sentences about things you never did. Here is a safe way to use one so that the result is accurate and still sounds like you.",
    sections: [
      {
        heading: "Start with your own facts",
        paragraphs: [
          "Write a plain list of your jobs, dates, tools and real results first. The AI should improve wording, not invent experience. If a tool adds a number or skill you cannot confirm, remove it.",
        ],
      },
      {
        heading: "Add the job post",
        paragraphs: [
          "Paste the job description and ask for the keywords you are missing. Add only those that are true for you. This is how you match a job without copying it.",
        ],
      },
      {
        heading: "Check every line before you send",
        list: [
          "Every date, title and employer is correct",
          "Every number is one you can explain in an interview",
          "No skill appears that you cannot use",
          "The tone sounds like you, not like a template",
        ],
      },
      {
        heading: "Use the score as a guide",
        paragraphs: [
          "An ATS score is a rough check of how readable your resume is for software. It does not predict whether you will be shortlisted. Use it to find formatting problems and missing keywords.",
        ],
      },
      {
        heading: "Keep different versions",
        paragraphs: [
          "Save a base resume and make a copy for each type of role. A short tailoring pass is enough, and it keeps your facts consistent.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["software-engineer", "data-analyst"],
  },
  {
    slug: "cv-format-uk",
    title: "CV format for the UK: length, layout and what to include",
    description:
      "How to write a UK CV: two pages at most, no photo, a short personal statement, clear order and the details UK employers expect.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "In the UK you apply with a CV. It is usually two pages, factual and easy to scan. Here is the format and what to leave out.",
    sections: [
      {
        heading: "The section order",
        ordered: true,
        list: [
          "Name and contact details: phone, email, town or city, LinkedIn",
          "Personal statement of three or four lines",
          "Work experience, latest first",
          "Education and qualifications",
          "Skills",
          "Interests, only if they add something",
        ],
      },
      {
        heading: "Length and size",
        paragraphs: [
          "Two pages of A4 is the normal limit. One page is fine for school leavers and graduates. Do not add pages to fill space.",
        ],
      },
      {
        heading: "Leave these out",
        list: [
          "Photo",
          "Date of birth, age, marital status or nationality",
          "Full postal address; a town or city is enough",
          "The words 'Curriculum Vitae' as a heading",
          "References; 'available on request' is optional",
        ],
      },
      {
        heading: "Education",
        paragraphs: [
          "List your highest qualification first. For graduates include the degree classification (for example 2:1) and, if recent, your A levels or equivalents. Include GCSE Maths and English results if they are asked for.",
        ],
      },
      {
        heading: "Use UK spelling",
        paragraphs: [
          "Write organised, programme and centre. Use UK date formats and the pound sign for amounts.",
        ],
      },
      {
        heading: "Keep it ATS friendly",
        list: [
          "Single column and standard headings",
          "No tables, icons or text boxes",
          "Save as PDF unless told otherwise",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["data-analyst-uk", "graduate-cv-uk"],
  },
  {
    slug: "graduate-cv-uk",
    title: "Graduate CV for the UK: example layout and tips",
    description:
      "How to write a CV as a UK graduate: what to put first, how to show internships, society roles and part-time work, and how long it should be.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "Graduate employers in the UK see many CVs with similar degrees. What stands out is clear evidence of skills from work, projects and activities. Here is how to lay it out.",
    sections: [
      {
        heading: "The section order",
        ordered: true,
        list: [
          "Contact details",
          "Personal statement of three or four lines",
          "Education, with degree, university, classification and key modules",
          "Work experience, internships and placements",
          "Projects, volunteering and society roles",
          "Skills",
        ],
      },
      {
        heading: "Education first",
        paragraphs: [
          "With little full-time work, put education above experience. Include your degree, university, dates, classification or expected grade and A levels or equivalents. Add two or three relevant modules or a dissertation title if it helps.",
        ],
      },
      {
        heading: "Count part-time and student work",
        paragraphs: [
          "Bar work, tutoring, retail and volunteering show reliability, teamwork and customer skills. Describe what you did, with one result or scale if true.",
        ],
      },
      {
        heading: "Show skills with evidence",
        paragraphs: [
          "Do not just write 'good communicator'. Say where you showed it: a presentation to 40 people, a society event, a customer-facing role.",
        ],
      },
      {
        heading: "Keep to one or two pages",
        paragraphs: [
          "One page is fine for most graduates. Two pages are acceptable if the content is strong.",
        ],
      },
      {
        heading: "Tailor for graduate schemes",
        paragraphs: [
          "Read the scheme's listed skills and values and use the same words where they are true for you.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["graduate-cv-uk", "data-analyst-uk"],
  },
  {
    slug: "cv-for-school-leavers-uk",
    title: "CV for school leavers in the UK (no experience)",
    description:
      "How to write a CV after school in the UK with little work experience: use GCSEs, work experience, volunteering and skills to show you are reliable.",
    published: "2026-11-27",
    readMinutes: 3,
    intro:
      "Employers and apprenticeship providers know that school leavers have little work history. They look for reliability, a good attitude and a neat, honest CV. Here is how to write one.",
    sections: [
      {
        heading: "The section order",
        ordered: true,
        list: [
          "Contact details",
          "Short personal statement of two or three lines",
          "Education and qualifications",
          "Work experience, volunteering and activities",
          "Skills",
          "Interests, briefly",
        ],
      },
      {
        heading: "Education",
        paragraphs: [
          "List your school, the years and your GCSEs or equivalents with grades, plus any A levels or BTECs you are taking. Put your latest qualification first.",
        ],
      },
      {
        heading: "What counts as experience",
        list: [
          "Work experience placements",
          "Part-time or weekend jobs",
          "Volunteering and community work",
          "Caring for family members",
          "Sports teams, clubs, Duke of Edinburgh and similar awards",
        ],
      },
      {
        heading: "Write about skills with examples",
        paragraphs: [
          "Teamwork, reliability and communication are best shown by a short example. Example shape: Helped run a school charity event for 100 guests. Use your own real example.",
        ],
      },
      {
        heading: "Keep it to one page",
        paragraphs: [
          "One clean page is enough. Check spelling, ask someone to read it and use a professional email address.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
  },
  {
    slug: "personal-statement-for-cv-uk",
    title: "Personal statement for a CV: how to write one (UK)",
    description:
      "How to write a CV personal statement: what to include, how long it should be, and examples of the shape for graduates, career changers and experienced workers.",
    published: "2026-11-27",
    readMinutes: 3,
    intro:
      "A personal statement is a short paragraph at the top of your UK CV. It tells the reader who you are, what you offer and what you want. Aim for three or four lines.",
    sections: [
      {
        heading: "What to include",
        list: [
          "Who you are: your role, level or degree",
          "What you offer: two or three skills or strengths that match the job",
          "What you want: the type of role or sector",
        ],
      },
      {
        heading: "Examples of the shape",
        paragraphs: [
          "Graduate: Recent Economics graduate with internship experience in banking and strong Excel skills, seeking a graduate analyst role.",
          "Experienced: Operations manager with 8 years in logistics, leading teams of up to 20 and reducing delivery delays, seeking a senior operations role.",
          "Career changer: Customer service professional with 5 years of experience moving into data analysis, with SQL and Excel skills gained through study and projects.",
          "These are examples of the shape, so use your own facts.",
        ],
      },
      {
        heading: "Keep it factual",
        paragraphs: [
          "Avoid empty phrases such as 'hard-working team player'. Replace them with something you can prove.",
        ],
      },
      {
        heading: "Tailor it",
        paragraphs: [
          "Change one or two phrases for each application so that the statement matches the job post.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
  },
  {
    slug: "cover-letter-format-uk",
    title: "Cover letter format for UK applications (with sample)",
    description:
      "How to write a UK cover letter: layout, length, how to open and close it, and a short sample that fits UK conventions.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "A UK cover letter is a one-page letter that goes with your CV. It explains why you want the job and why you are a good fit. Here is the layout and a sample.",
    sections: [
      {
        heading: "The layout",
        ordered: true,
        list: [
          "Your address block or contact details at the top right or left",
          "Date",
          "Employer's name and address, if you know them",
          "Greeting: Dear Ms Smith, or Dear Hiring Manager",
          "Opening: the role and where you saw it",
          "Middle: two short paragraphs linking your experience to the role",
          "Closing: thanks and your availability for interview",
          "Sign-off: Yours sincerely if you used a name, Yours faithfully if you wrote Dear Sir or Madam",
        ],
      },
      {
        heading: "A short sample",
        paragraphs: [
          "Dear [Name],",
          "I am writing to apply for the [Job title] position advertised on [site]. I am a [degree or role] with experience in [skill], and I am keen to join [Company].",
          "[A specific example from work, study or volunteering that matches the job.]",
          "Thank you for considering my application. I would welcome the chance to discuss it at interview.",
          "Yours sincerely,",
          "[Your name]",
          "These are placeholders, so use your own facts.",
        ],
      },
      {
        heading: "Length",
        paragraphs: [
          "One page of A4. Keep paragraphs short.",
        ],
      },
      {
        heading: "Use UK spelling and tone",
        paragraphs: [
          "Polite, clear and modest works best. Avoid slang and strong claims you cannot prove.",
        ],
      },
    ],
    cta: { label: "Write my cover letter", href: "/builder/new?tab=cover-letter" },
  },
  {
    slug: "nhs-supporting-statement-uk",
    title: "NHS job applications: how to write a supporting statement",
    description:
      "How to write a supporting statement for an NHS job application: match the person specification, give evidence for each point and show the values the role asks for.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "Many NHS jobs are applied for through an online application form rather than a plain CV. The key part is the supporting statement. Check the job advert for the exact process, because it can differ by employer.",
    sections: [
      {
        heading: "Start with the person specification",
        paragraphs: [
          "The job pack lists essential and desirable criteria. Treat each one as a heading and write about it. If you do not answer a criterion, the shortlisting team cannot give you credit for it.",
        ],
      },
      {
        heading: "Give evidence, not claims",
        paragraphs: [
          "For each criterion give a short example: what the situation was, what you did and what happened. Use real examples from work, placements, study or volunteering.",
        ],
      },
      {
        heading: "Show the values",
        paragraphs: [
          "NHS roles often ask for values such as compassion, respect and teamwork. Show them through your examples, using words from the job pack where they are true for you.",
        ],
      },
      {
        heading: "Check the basics",
        list: [
          "Stay within any word limit",
          "Use accurate dates and job titles",
          "Check any registration, such as with a professional body, if the role needs it",
          "Proofread before you submit",
        ],
      },
      {
        heading: "Keep a CV ready too",
        paragraphs: [
          "Some employers still ask for a CV or want one for speculative applications. Keep a clean two-page version.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
    relatedExamples: ["registered-nurse-uk-nhs"],
  },
  {
    slug: "resume-vs-cv-difference",
    title: "Resume vs CV: what is the difference and which one to use",
    description:
      "The difference between a resume and a CV, and which one to use in India, the USA, the UK, Canada, Australia and other countries.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "The words resume and CV mean different things in different countries. Using the right document avoids confusion and helps your application get read.",
    sections: [
      {
        heading: "The short answer",
        paragraphs: [
          "A resume is a short, targeted summary of your work, usually one or two pages. A CV (curriculum vitae) is a fuller record, longer in academic and research careers. In many countries the two words are used for the same job application document.",
        ],
      },
      {
        heading: "By country",
        list: [
          "USA and Canada: resume for jobs; CV for academic, research and some medical roles",
          "UK and Ireland: CV is the normal job document, usually two pages",
          "India: both words are used; for most jobs it is a one or two page document",
          "Australia and New Zealand: both words are used; resume is common",
          "Europe: a CV, often a structured one; check local norms for details like photos",
        ],
      },
      {
        heading: "What to do",
        paragraphs: [
          "Read the job post. If it says resume or CV, use that word in your file name. If it asks for a particular length or format, follow it. If you are unsure, send a clean one or two page document.",
        ],
      },
      {
        heading: "Academic CVs",
        paragraphs: [
          "Academic CVs list publications, teaching, grants and conferences, so they can run many pages. Do not use that format for ordinary company jobs.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
  },
  {
    slug: "resume-rules-by-country",
    title: "Resume rules by country: photo, age and length",
    description:
      "A simple guide to what goes on a resume in different countries: photo, date of birth, length and spelling, for India, the USA, the UK, Canada, Australia, the UAE and Singapore.",
    published: "2026-11-27",
    readMinutes: 4,
    intro:
      "Resume norms change from one country to another. What is normal in one place can hurt you in another. Use this guide as a starting point and always check the job post and local advice.",
    sections: [
      {
        heading: "The general picture",
        list: [
          "USA and Canada: no photo, no age or marital status, one page for most people",
          "UK: no photo, no date of birth, two pages at most",
          "Australia: usually no photo, two or three pages is common for experienced candidates",
          "India: no photo needed for most corporate jobs; one or two pages; skip date of birth unless asked",
          "UAE and Gulf: employers often ask about visa status and notice period, so mention them briefly",
          "Singapore: keep it short and factual; some employers ask for current and expected salary, so check the job post",
        ],
      },
      {
        heading: "Why it matters",
        paragraphs: [
          "In several countries, employers avoid photos and personal details to reduce bias. Adding them can make your resume look out of touch with local practice.",
        ],
      },
      {
        heading: "Spelling and dates",
        paragraphs: [
          "Use UK spelling for the UK, India, Australia and Singapore, and US spelling for the USA. Match the date format of the country.",
        ],
      },
      {
        heading: "Always check",
        paragraphs: [
          "These are general norms and they change. Read the employer's job post and apply their instructions first.",
        ],
      },
      {
        heading: "Build for your country",
        paragraphs: [
          "Lettr has templates and guidance for several countries, so you can start from a layout that fits.",
        ],
      },
    ],
    cta: { label: "Check my resume for free", href: "/resume-checker" },
  },
];

export function getGuide(slug: string) {
  return GUIDES.find((g) => g.slug === slug);
}

/** Which guides to suggest at the end of each guide. Plain data; a test checks every slug exists. */
export const READ_NEXT: Record<string, string[]> = {
  "resume-format-for-freshers": ["resume-format-for-btech-freshers", "resume-format-for-commerce-and-mba-freshers", "fresher-resume-examples"],
  "resume-format-for-experienced-professionals": ["resume-for-1-2-years-experience", "explain-gap-or-short-job-on-resume", "ats-resume-checklist"],
  "resume-format-for-btech-freshers": ["resume-format-for-freshers", "fresher-resume-examples", "ats-resume-checklist"],
  "resume-format-for-commerce-and-mba-freshers": ["resume-format-for-freshers", "fresher-resume-examples", "ats-resume-checklist"],
  "naukri-resume": ["ats-friendly-resume", "resume-for-1-2-years-experience"],
  "ats-friendly-resume": ["ats-resume-requirements", "ats-resume-checklist"],
  "cover-letter-format": ["ats-friendly-resume", "resume-for-1-2-years-experience"],
  "ats-resume-example": ["ats-resume-requirements", "ats-resume-checklist"],
  "ats-resume-checklist": ["ats-resume-requirements", "ats-resume-example"],
  "fresher-resume-examples": ["resume-format-for-freshers", "bcom-llb-resume-example"],
  "bcom-llb-resume-example": ["how-to-write-llb-in-resume", "law-student-resume-format", "legal-assistant-resume-example"],
  "how-to-write-llb-in-resume": ["law-student-resume-format", "bcom-llb-resume-example", "legal-assistant-resume-example"],
  "law-student-resume-format": ["moot-court-and-internships-on-resume", "how-to-write-llb-in-resume", "resume-for-law-firm-applications"],
  "moot-court-and-internships-on-resume": ["law-student-resume-format", "resume-for-law-firm-applications"],
  "resume-for-law-firm-applications": ["law-student-resume-format", "how-to-write-llb-in-resume"],
  "resignation-letter-format-india": ["resignation-letter-for-one-month-notice", "resignation-letter-for-better-offer", "resignation-letter-immediate-effect", "resignation-letter-for-health-or-family-reasons"],
  "resignation-letter-for-one-month-notice": ["resignation-letter-format-india", "resignation-letter-immediate-effect"],
  "resignation-letter-immediate-effect": ["resignation-letter-format-india", "resignation-letter-for-one-month-notice"],
  "resignation-letter-for-better-offer": ["resignation-letter-format-india", "resignation-letter-for-one-month-notice"],
  "resignation-letter-for-health-or-family-reasons": ["resignation-letter-format-india", "resignation-letter-immediate-effect"],
  "synonyms-for-managed-on-a-resume": ["synonyms-for-led-on-a-resume", "synonyms-for-responsible-for-on-a-resume", "ats-friendly-resume"],
  "synonyms-for-led-on-a-resume": ["synonyms-for-managed-on-a-resume", "synonyms-for-helped-on-a-resume"],
  "synonyms-for-responsible-for-on-a-resume": ["synonyms-for-managed-on-a-resume", "resume-for-1-2-years-experience"],
  "synonyms-for-helped-on-a-resume": ["synonyms-for-led-on-a-resume", "synonyms-for-responsible-for-on-a-resume"],
  "resume-format-usa": ["cover-letter-format-usa", "how-to-use-an-ai-resume-builder", "resume-vs-cv-difference"],
  "cover-letter-format-usa": ["resume-format-usa", "cover-letter-format"],
  "how-to-use-an-ai-resume-builder": ["ats-friendly-resume", "resume-format-usa"],
  "cv-format-uk": ["graduate-cv-uk", "personal-statement-for-cv-uk", "cover-letter-format-uk"],
  "graduate-cv-uk": ["cv-format-uk", "personal-statement-for-cv-uk"],
  "cv-for-school-leavers-uk": ["cv-format-uk", "personal-statement-for-cv-uk"],
  "personal-statement-for-cv-uk": ["cv-format-uk", "graduate-cv-uk"],
  "cover-letter-format-uk": ["cv-format-uk", "personal-statement-for-cv-uk"],
  "nhs-supporting-statement-uk": ["cv-format-uk", "cover-letter-format-uk"],
  "resume-vs-cv-difference": ["resume-rules-by-country", "cv-format-uk", "resume-format-usa"],
  "resume-rules-by-country": ["resume-vs-cv-difference", "resume-format-usa", "cv-format-uk"],
  "ats-resume-requirements": ["ats-friendly-resume", "ats-resume-example"],
  "resume-for-1-2-years-experience": ["resume-format-for-experienced-professionals", "explain-gap-or-short-job-on-resume", "ats-resume-checklist"],
  "explain-gap-or-short-job-on-resume": ["resume-for-1-2-years-experience", "ats-friendly-resume"],
  "ai-engineer-resume-example": ["resume-for-1-2-years-experience", "ats-resume-requirements"],
  "legal-assistant-resume-example": ["bcom-llb-resume-example", "how-to-write-llb-in-resume"],
};

export function readNext(slug: string): Guide[] {
  return (READ_NEXT[slug] ?? []).map((s) => getGuide(s)).filter((x): x is Guide => !!x);
}

/** Guides to show on a resume example page: those that list it, topped up with two general ATS guides (3 at most). */
export function guidesForExample(exampleSlug: string, max = 3): Guide[] {
  const out = GUIDES.filter((g) => g.relatedExamples?.includes(exampleSlug)).slice(0, max);
  for (const s of ["ats-friendly-resume", "ats-resume-checklist", "ats-resume-example"]) {
    if (out.length >= Math.max(2, Math.min(max, out.length + 1)) && out.length >= 2) break;
    const g = getGuide(s);
    if (g && !out.some((o) => o.slug === g.slug)) out.push(g);
  }
  return out.slice(0, max);
}
