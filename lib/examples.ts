import type { ResumeData } from "./types";

/**
 * The examples library: made-up people, written to show what a strong
 * resume looks like for each role. None of them is a real person or a
 * customer, and every page says so. Numbers in the bullets are there to
 * show the style - users replace them with their own.
 */

export type ExampleCategory =
  | "Students & freshers"
  | "Tech"
  | "Business & finance"
  | "Marketing & sales"
  | "Healthcare"
  | "Skilled trades"
  | "Operations & support"
  | "Education & design"
  | "Career changes";

export type ExampleStage = "Fresher" | "Early career" | "Mid-level" | "Senior" | "Career change" | "Returning";

export type ResumeExample = {
  slug: string;
  title: string;
  category: ExampleCategory;
  stage: ExampleStage;
  template: string;
  why: string[];
  resume: ResumeData;
};

type Job = [role: string, company: string, start: string, end: string, bullets: string[]];
type Edu = [degree: string, school: string, start: string, end: string];
type Extras = {
  projects?: [name: string, description: string][];
  certs?: [name: string, issuer: string, date: string][];
  languages?: string[];
  achievements?: string[];
};

function ex(
  slug: string,
  title: string,
  category: ExampleCategory,
  stage: ExampleStage,
  template: string,
  person: { name: string; location: string; linkedin?: boolean },
  summary: string,
  jobs: Job[],
  edu: Edu[],
  skills: string[],
  why: string[],
  extras: Extras = {}
): ResumeExample {
  const handle = person.name.toLowerCase().replace(/[^a-z]+/g, ".").replace(/^\.|\.$/g, "");
  return {
    slug,
    title,
    category,
    stage,
    template,
    why,
    resume: {
      contact: {
        fullName: person.name,
        email: `${handle}@email.com`,
        phone: "+91 98XXX XXXXX",
        location: person.location,
        linkedin: person.linkedin === false ? undefined : `linkedin.com/in/${handle.replace(/\./g, "-")}`,
      },
      summary,
      experience: jobs.map(([role, company, startDate, endDate, bullets], i) => ({
        id: `${slug}-j${i}`,
        role,
        company,
        startDate,
        endDate,
        bullets,
      })),
      education: edu.map(([degree, school, startDate, endDate], i) => ({ id: `${slug}-e${i}`, degree, school, startDate, endDate })),
      skills,
      projects: (extras.projects ?? []).map(([name, description], i) => ({ id: `${slug}-p${i}`, name, description })),
      certifications: (extras.certs ?? []).map(([name, issuer, date], i) => ({ id: `${slug}-c${i}`, name, issuer, date })),
      languages: extras.languages ?? [],
      achievements: extras.achievements ?? [],
      customization: {},
    },
  };
}

export const EXAMPLES: ResumeExample[] = [
  // ---------- Students & freshers ----------
  ex(
    "campus-placement-software-engineer",
    "Software Engineer (campus placement)",
    "Students & freshers",
    "Fresher",
    "fresher",
    { name: "Karthik Raman", location: "Chennai" },
    "Final-year B.Tech Computer Science student who enjoys building fast, reliable web apps. Looking for a software engineer role through campus placements.",
    [["Software Engineering Intern", "Zentrix Labs", "May 2025", "Jul 2025", ["Built 3 REST APIs in Node.js used by the internal billing dashboard", "Wrote unit tests that raised coverage of the payments module from 41% to 78%"]]],
    [["B.Tech, Computer Science (CGPA 8.6)", "SRM Institute of Science and Technology", "2022", "2026"], ["Class XII, CBSE (92%)", "DAV Public School, Chennai", "2020", "2022"]],
    ["Java", "Python", "Data structures", "SQL", "React", "Git", "Linux"],
    ["Leads with education and projects, which is what campus recruiters read first.", "Every project says what was built and how many people used it.", "CGPA and board percentage are easy to spot."],
    {
      projects: [
        ["Hostel Mess Feedback App", "React and Firebase app used by 600+ students to rate meals; the mess committee now reviews it weekly."],
        ["Leetcode Tracker", "Chrome extension that tracks daily practice streaks; 1,200 installs."],
      ],
      certs: [["Java Programming", "NPTEL (Elite)", "2024"]],
      achievements: ["Finalist, inter-college hackathon 2024", "Solved 450+ problems on LeetCode"],
    }
  ),
  ex(
    "mba-fresher-marketing",
    "MBA Fresher (Marketing)",
    "Students & freshers",
    "Fresher",
    "fresher",
    { name: "Ananya Iyer", location: "Pune" },
    "MBA (Marketing) graduate with summer-internship experience in FMCG brand management. Comfortable with consumer research, Excel models and running small campaigns end to end.",
    [
      ["Summer Intern, Brand Management", "Sunvale Foods", "Apr 2025", "Jun 2025", ["Ran a 300-respondent survey on snack habits in tier-2 cities and presented findings to the brand head", "Proposed a pack-size change for one SKU; now being piloted in 40 stores"]],
      ["Marketing Coordinator (part-time)", "Campus Marketing Club", "Jul 2024", "Mar 2025", ["Organised 4 sponsor events that raised ₹3.2 lakh"]],
    ],
    [["MBA, Marketing", "Symbiosis Institute of Business Management, Pune", "2024", "2026"], ["BBA", "Christ University, Bengaluru", "2020", "2023"]],
    ["Market research", "Excel", "Power BI", "Consumer insights", "Canva", "Presentation"],
    ["Internship results come first, with the scale of the work (300 respondents, 40 stores).", "Shows leadership outside class through the club role.", "Skills match what brand teams ask for in job posts."],
    { certs: [["Google Analytics Certification", "Google", "2025"]], languages: ["English", "Hindi", "Tamil"] }
  ),
  ex(
    "bcom-fresher-accounts",
    "B.Com Fresher (Accounts)",
    "Students & freshers",
    "Fresher",
    "classic",
    { name: "Rohit Gupta", location: "Jaipur", linkedin: false },
    "B.Com graduate with articleship-style training in bookkeeping and GST returns. Accurate with numbers and quick with Tally and Excel.",
    [["Accounts Trainee", "Gupta & Associates, Chartered Accountants", "Jul 2025", "Present", ["Record daily entries for 12 small-business clients in Tally Prime", "Help prepare monthly GSTR-1 and GSTR-3B filings", "Reconcile bank statements, cutting month-end close time by 2 days"]]],
    [["B.Com", "University of Rajasthan", "2022", "2025"]],
    ["Tally Prime", "GST returns", "Excel (VLOOKUP, pivots)", "Bank reconciliation", "TDS basics"],
    ["Names the exact tools and filings Indian firms use.", "Shows trust: real client work, not just coursework.", "Short and clean - right for a first job."],
    { certs: [["GST Practitioner Course", "NIIT", "2025"]], languages: ["English", "Hindi"] }
  ),
  ex(
    "mechanical-engineer-fresher",
    "Mechanical Engineer (Fresher)",
    "Students & freshers",
    "Fresher",
    "fresher",
    { name: "Aditya Kulkarni", location: "Nashik" },
    "Mechanical engineering graduate with plant training in production and quality. Hands-on with CAD and keen on a graduate engineer trainee role.",
    [["Industrial Trainee", "Deccan Auto Components", "Jun 2025", "Jul 2025", ["Mapped one assembly line and suggested a fixture change that cut changeover time by 12 minutes", "Logged defects for 3 weeks and built a Pareto chart used in the daily quality meeting"]]],
    [["B.E., Mechanical Engineering (CGPA 8.1)", "K.K. Wagh Institute of Engineering, Nashik", "2021", "2025"]],
    ["SolidWorks", "AutoCAD", "GD&T", "Lean basics", "Six Sigma Yellow Belt", "MS Excel"],
    ["Turns a short internship into clear results.", "Lists the CAD and quality tools plants filter for.", "Project shows practical design skill."],
    { projects: [["Low-cost Solar Dryer", "Final-year project; prototype dried 5 kg of produce per day and won 2nd prize at the state project expo."]] }
  ),
  ex(
    "law-graduate",
    "Law Graduate (LLB)",
    "Students & freshers",
    "Fresher",
    "scholar",
    { name: "Meghna Rao", location: "Bengaluru" },
    "Five-year B.A. LL.B. graduate with internships in corporate law and litigation. Strong legal research and drafting; enrolled with the Bar Council of Karnataka.",
    [
      ["Legal Intern", "Shetty & Partners (Corporate)", "Dec 2024", "Jan 2025", ["Drafted 6 NDAs and a shareholders' agreement under supervision", "Researched SEBI regulations for a fundraising client"]],
      ["Legal Intern", "Office of a Senior Advocate, Karnataka High Court", "May 2024", "Jun 2024", ["Prepared case briefs and list of dates for 10 civil matters"]],
    ],
    [["B.A. LL.B. (Hons.)", "Christ University School of Law", "2020", "2025"]],
    ["Legal research (SCC Online, Manupatra)", "Contract drafting", "Corporate law", "Civil procedure"],
    ["Internships show both corporate and litigation exposure.", "Specific documents drafted, not just 'assisted seniors'.", "Calm, centred layout suits law firms."],
    { achievements: ["Semi-finalist, National Moot Court Competition 2024", "Published case note in the university law review"], languages: ["English", "Kannada", "Hindi"] }
  ),
  ex(
    "hotel-management-fresher",
    "Hotel Management Graduate",
    "Students & freshers",
    "Fresher",
    "ribbon",
    { name: "Simran Kaur", location: "Chandigarh", linkedin: false },
    "Hotel management graduate with industrial training in front office and F&B. Warm with guests and calm during busy shifts.",
    [["Industrial Trainee", "The Grand Residency, Chandigarh", "Jan 2025", "Jun 2025", ["Rotated through front office, housekeeping, F&B service and kitchen", "Handled check-ins for up to 40 guests a shift during the wedding season", "Earned 3 named mentions in guest feedback"]]],
    [["B.Sc. Hospitality and Hotel Administration", "IHM Chandigarh", "2021", "2025"]],
    ["Guest relations", "Opera PMS", "F&B service", "Upselling", "Complaint handling"],
    ["Training is described by department, which hotels expect.", "Guest feedback is a strong, concrete signal.", "Friendly design fits a guest-facing role."],
    { languages: ["English", "Hindi", "Punjabi"] }
  ),

  // ---------- Tech ----------
  ex(
    "software-engineer",
    "Software Engineer",
    "Tech",
    "Mid-level",
    "technical",
    { name: "Vikram Shetty", location: "Bengaluru" },
    "Backend engineer with 5 years building payment and order systems in Java and Go. I care about systems that stay up on sale days.",
    [
      ["Software Engineer II", "ShopKart", "2022", "Present", ["Re-designed the order service to handle 4x Diwali-sale traffic with no downtime", "Cut p95 checkout latency from 900 ms to 320 ms by adding caching and query fixes", "Mentor 3 junior engineers"]],
      ["Software Engineer", "PayQuick", "2020", "2022", ["Built the refunds API used by 2 million users a month", "Wrote the on-call runbook that halved incident response time"]],
    ],
    [["B.Tech, Information Technology", "NIT Surathkal", "2016", "2020"]],
    ["Java", "Go", "Spring Boot", "PostgreSQL", "Kafka", "AWS", "Docker", "System design"],
    ["Every bullet has a measurable result (traffic, latency, users).", "Tech stack is easy to scan for recruiters' keywords.", "Shows growth from building features to mentoring."]
  ),
  ex(
    "frontend-developer",
    "Frontend Developer",
    "Tech",
    "Early career",
    "modern",
    { name: "Neha Joshi", location: "Hyderabad" },
    "Frontend developer with 3 years in React and TypeScript. I build fast, accessible interfaces and work closely with designers.",
    [
      ["Frontend Developer", "Kitebird Software", "2023", "Present", ["Rebuilt the customer dashboard in React, improving Lighthouse performance from 54 to 91", "Created a shared component library used by 4 product teams"]],
      ["Junior Web Developer", "PixelCraft Agency", "2022", "2023", ["Shipped 12 client websites, all passing WCAG AA checks"]],
    ],
    [["B.Sc. Computer Science", "Osmania University", "2019", "2022"]],
    ["React", "TypeScript", "Next.js", "Tailwind CSS", "Accessibility", "Jest", "Figma"],
    ["Performance and accessibility numbers stand out to engineering managers.", "Component library shows impact beyond one team.", "Clean modern layout matches the role."]
  ),
  ex(
    "data-analyst",
    "Data Analyst",
    "Tech",
    "Early career",
    "grid",
    { name: "Priya Nair", location: "Mumbai" },
    "Data analyst with 3 years turning messy sales and marketing data into dashboards people actually use. Strong in SQL, Python and Power BI.",
    [
      ["Data Analyst", "Brightside Retail", "2023", "Present", ["Built the weekly sales dashboard used by 25 store managers", "Found a pricing gap in 2 categories that recovered ₹40 lakh a quarter", "Automated a 6-hour monthly report down to 10 minutes with Python"]],
      ["Business Analyst Intern", "FinEdge", "2022", "2023", ["Cleaned and merged 3 customer databases for a churn study"]],
    ],
    [["B.Sc. Statistics", "St. Xavier's College, Mumbai", "2019", "2022"]],
    ["SQL", "Python (pandas)", "Power BI", "Excel", "A/B testing", "Statistics"],
    ["Shows money and time saved, not just tools used.", "Grid layout keeps a technical resume easy to scan.", "Skills match common analyst job posts."],
    { certs: [["Microsoft Certified: Power BI Data Analyst", "Microsoft", "2024"]] }
  ),
  ex(
    "devops-engineer",
    "DevOps Engineer",
    "Tech",
    "Mid-level",
    "technical",
    { name: "Arun Prakash", location: "Coimbatore" },
    "DevOps engineer with 6 years automating cloud infrastructure on AWS. I make deployments boring and outages rare.",
    [
      ["Senior DevOps Engineer", "CloudNine Systems", "2021", "Present", ["Moved 40 services to Kubernetes, cutting hosting cost by 28%", "Built CI/CD pipelines that took releases from weekly to 15 times a day", "Led incident reviews; uptime rose to 99.95%"]],
      ["System Administrator", "Infotech Solutions", "2018", "2021", ["Managed 200+ Linux servers and automated patching with Ansible"]],
    ],
    [["B.E., Electronics and Communication", "PSG College of Technology", "2014", "2018"]],
    ["AWS", "Kubernetes", "Terraform", "Jenkins", "GitHub Actions", "Prometheus", "Linux", "Python"],
    ["Cost, speed and uptime are the three things DevOps hiring managers check.", "Shows a clear path from sysadmin to senior.", "Certifications back up the cloud skills."],
    { certs: [["AWS Certified Solutions Architect – Associate", "Amazon Web Services", "2023"], ["Certified Kubernetes Administrator", "CNCF", "2022"]] }
  ),
  ex(
    "qa-engineer",
    "QA / Test Engineer",
    "Tech",
    "Early career",
    "split",
    { name: "Sneha Patil", location: "Pune" },
    "QA engineer with 3 years in manual and automated testing for banking apps. I find the bugs before customers do.",
    [
      ["QA Engineer", "FinServe Technologies", "2022", "Present", ["Automated 350 regression tests with Selenium, cutting test cycles from 4 days to 1", "Caught a payment rounding bug before a release affecting 80,000 accounts"]],
      ["Trainee Test Engineer", "TestPro Services", "2021", "2022", ["Wrote and ran 600+ manual test cases for a mobile banking app"]],
    ],
    [["B.E., Information Technology", "Pune University", "2017", "2021"]],
    ["Selenium", "Java", "Postman", "JIRA", "SQL", "API testing", "Agile"],
    ["Shows the value of testing in money and customers protected.", "Automation numbers prove growth beyond manual testing.", "Split layout keeps tools and contact easy to find."],
    { certs: [["ISTQB Foundation Level", "ISTQB", "2022"]] }
  ),
  ex(
    "product-manager",
    "Product Manager",
    "Tech",
    "Senior",
    "executive",
    { name: "Rahul Mehta", location: "Gurugram" },
    "Product manager with 8 years in consumer fintech. I ship products that move adoption and revenue, and I build teams that ship on time.",
    [
      ["Senior Product Manager", "PaySphere", "2021", "Present", ["Launched UPI Autopay: 1.4 million users in year one", "Raised loan-application completion from 31% to 48% by redesigning the KYC flow", "Grew the product team from 2 to 7 PMs"]],
      ["Product Manager", "Ledgerly", "2018", "2021", ["Cut failed payments by 18% with smarter retries"]],
    ],
    [["MBA", "IIM Lucknow", "2016", "2018"], ["B.Tech, Electrical Engineering", "IIT Roorkee", "2012", "2016"]],
    ["Product strategy", "Roadmaps", "Payments", "SQL", "A/B testing", "Stakeholder management"],
    ["Leads with outcomes (users, conversion) rather than tasks.", "Shows leadership through team growth.", "Senior, understated layout."]
  ),

  // ---------- Business & finance ----------
  ex(
    "chartered-accountant",
    "Chartered Accountant (CA)",
    "Business & finance",
    "Mid-level",
    "classic",
    { name: "Pooja Agarwal", location: "Kolkata" },
    "Chartered Accountant with 5 years in statutory audit and direct tax. Known for clean audit files and on-time closings.",
    [
      ["Audit Manager", "Banerjee & Co., Chartered Accountants", "2022", "Present", ["Lead statutory audits for 15 mid-size companies with turnover up to ₹500 crore", "Introduced audit checklists that cut review comments by 40%", "Manage a team of 6 articled assistants"]],
      ["Audit Executive", "Mehta Kapoor & Co.", "2020", "2022", ["Worked on audits of 2 listed manufacturing companies under Ind AS"]],
    ],
    [["Chartered Accountant", "ICAI", "2017", "2020"], ["B.Com (Hons.)", "St. Xavier's College, Kolkata", "2014", "2017"]],
    ["Statutory audit", "Ind AS", "Income tax", "GST", "Tally", "SAP FICO basics", "Excel"],
    ["Shows the size of clients, which matters in audit hiring.", "Process improvement proves you raise quality, not just do the work.", "Classic layout is the norm for CA roles."],
    { achievements: ["Cleared CA Final in first attempt"] }
  ),
  ex(
    "accountant",
    "Accountant",
    "Business & finance",
    "Early career",
    "compact",
    { name: "Suresh Babu", location: "Hyderabad", linkedin: false },
    "Accountant with 4 years handling books, GST and payroll for a manufacturing SME. Reliable with deadlines and numbers.",
    [["Accountant", "Sri Venkateswara Plastics", "2021", "Present", ["Maintain books for a ₹60 crore business in Tally Prime", "File monthly GST returns and quarterly TDS returns on time, with zero penalties in 3 years", "Run payroll for 120 staff"]]],
    [["M.Com", "Osmania University", "2019", "2021"], ["B.Com", "Osmania University", "2016", "2019"]],
    ["Tally Prime", "GST", "TDS", "Payroll", "Excel", "Accounts payable"],
    ["Zero penalties is a powerful, simple proof of reliability.", "Scale of the business and payroll is clear.", "Compact layout fits all details on one page."]
  ),
  ex(
    "business-analyst",
    "Business Analyst",
    "Business & finance",
    "Mid-level",
    "grid",
    { name: "Farhan Sheikh", location: "Bengaluru" },
    "Business analyst with 5 years translating business needs into clear requirements for IT teams in insurance and banking.",
    [
      ["Senior Business Analyst", "InsureWell", "2022", "Present", ["Wrote requirements for a claims portal that cut claim processing time from 12 days to 5", "Ran 30+ workshops with operations and IT"]],
      ["Business Analyst", "Infoline Systems (banking client)", "2020", "2022", ["Documented 120 user stories for a loan-origination system"]],
    ],
    [["MBA, Operations", "Christ University", "2018", "2020"], ["B.E., Computer Science", "VTU", "2014", "2018"]],
    ["Requirements gathering", "User stories", "SQL", "Process mapping (BPMN)", "JIRA", "Agile"],
    ["Shows business impact, not just documents written.", "Mix of IT and MBA background is clear.", "Grid layout suits a structured profile."],
    { certs: [["Certified Business Analysis Professional (CBAP)", "IIBA", "2024"]] }
  ),
  ex(
    "bank-relationship-manager",
    "Bank Relationship Manager",
    "Business & finance",
    "Mid-level",
    "elegant",
    { name: "Kavya Reddy", location: "Vijayawada" },
    "Relationship manager with 6 years in retail banking. I grow customer deposits and investments by building trust over years.",
    [
      ["Relationship Manager, Priority Banking", "Pinnacle Bank", "2021", "Present", ["Manage a book of 220 high-value customers worth ₹180 crore", "Grew the book's investments by 35% in 2 years", "Rated top-3 RM in the circle for 2024"]],
      ["Personal Banker", "Unity Bank", "2019", "2021", ["Opened 600+ accounts and cross-sold insurance and credit cards"]],
    ],
    [["MBA, Finance", "Andhra University", "2017", "2019"]],
    ["Wealth products", "Cross-selling", "KYC/AML", "CRM", "Customer retention"],
    ["Book size and growth are what bank hiring managers ask about first.", "Ranking shows performance against peers.", "Elegant style suits premium banking."],
    { certs: [["NISM Series V-A: Mutual Fund Distributors", "NISM", "2019"], ["IRDAI Insurance Agent", "IRDAI", "2019"]] }
  ),
  ex(
    "financial-analyst",
    "Financial Analyst",
    "Business & finance",
    "Early career",
    "minimal",
    { name: "Ishaan Malhotra", location: "New Delhi" },
    "Financial analyst with 3 years in FP&A for a consumer brand. I build the models leadership uses to set budgets.",
    [
      ["Financial Analyst, FP&A", "Urban Threads", "2023", "Present", ["Built the annual budget model across 6 business units", "Flagged a 9% cost overrun early, saving ₹2.4 crore", "Prepare the monthly board pack"]],
      ["Analyst", "Sterling Advisory", "2022", "2023", ["Supported 4 due-diligence projects"]],
    ],
    [["B.Com (Hons.)", "Shri Ram College of Commerce", "2019", "2022"]],
    ["Financial modelling", "Excel", "Power BI", "Budgeting", "Variance analysis"],
    ["Shows money saved and decisions influenced.", "Minimal layout is safe for finance and ATS.", "Board-pack work signals trust from leadership."],
    { certs: [["CFA Level I", "CFA Institute", "2024"]] }
  ),
  ex(
    "hr-executive",
    "HR Executive",
    "Business & finance",
    "Early career",
    "spotlight",
    { name: "Divya Menon", location: "Kochi" },
    "HR executive with 4 years in recruitment and employee engagement for a fast-growing IT company.",
    [["HR Executive", "TechNova Solutions", "2021", "Present", ["Hired 140 people in 2 years, cutting average time-to-hire from 38 to 24 days", "Started a buddy programme that reduced 90-day attrition by 30%", "Run payroll inputs and statutory compliance (PF, ESI)"]]],
    [["MBA, Human Resources", "Rajagiri College of Social Sciences", "2019", "2021"]],
    ["Recruitment", "Onboarding", "Employee engagement", "PF & ESI", "Excel", "Zoho People"],
    ["Hiring numbers and attrition results are exactly what HR heads check.", "Covers both people work and compliance.", "Spotlight layout puts the summary up front."]
  ),

  // ---------- Marketing & sales ----------
  ex(
    "digital-marketing-executive",
    "Digital Marketing Executive",
    "Marketing & sales",
    "Early career",
    "modern",
    { name: "Tanvi Shah", location: "Ahmedabad" },
    "Digital marketer with 3 years running paid and organic campaigns for D2C brands. I watch every rupee of ad spend.",
    [
      ["Digital Marketing Executive", "GreenLeaf Organics (D2C)", "2023", "Present", ["Manage ₹8 lakh a month in Meta and Google ads at 3.4x return on ad spend", "Grew organic traffic 2.5x in a year through SEO and blog content", "Run weekly email campaigns to 60,000 subscribers"]],
      ["Marketing Intern", "Social Buzz Agency", "2022", "2023", ["Managed Instagram for 5 small clients"]],
    ],
    [["BBA, Marketing", "Nirma University", "2019", "2022"]],
    ["Meta Ads", "Google Ads", "SEO", "Google Analytics 4", "Email marketing", "Canva"],
    ["Spend and return figures show you can be trusted with budget.", "Covers paid, organic and email - the full stack.", "Modern template fits a digital role."],
    { certs: [["Google Ads Search Certification", "Google", "2024"]] }
  ),
  ex(
    "sales-executive",
    "Sales Executive",
    "Marketing & sales",
    "Mid-level",
    "classic",
    { name: "Rahul Verma", location: "Delhi" },
    "Regional sales executive with 5 years in B2B distribution, known for opening new dealer accounts and keeping them.",
    [
      ["Sales Executive", "Apex Distributors", "2021", "Present", ["Grew North region revenue from ₹2.1 crore to ₹3.4 crore in 18 months", "Signed 26 new dealers across 4 cities; 9 in 10 still order a year on"]],
      ["Sales Trainee", "Kumar Traders", "2019", "2021", ["Supported 3 senior reps on 40+ dealer visits a month"]],
    ],
    [["B.Com", "Delhi University", "2016", "2019"]],
    ["B2B sales", "Dealer management", "CRM", "Negotiation", "Excel reporting"],
    ["Revenue growth and dealer retention say more than 'handled clients'.", "Short, clean layout respects a busy sales manager's time.", "Shows steady growth from trainee to owning a region."],
    { languages: ["Hindi", "English", "Punjabi"] }
  ),
  ex(
    "content-writer",
    "Content Writer",
    "Marketing & sales",
    "Early career",
    "elegant",
    { name: "Aditi Banerjee", location: "Kolkata" },
    "Content writer with 3 years writing blogs, product pages and newsletters for SaaS and edtech brands. Clear, friendly and SEO-aware.",
    [["Content Writer", "LearnLoop (edtech)", "2022", "Present", ["Wrote 150+ blog posts; 12 rank on page one of Google", "Grew the newsletter from 8,000 to 31,000 readers", "Rewrote course pages, lifting sign-ups by 18%"]]],
    [["B.A. English Literature", "Jadavpur University", "2019", "2022"]],
    ["SEO writing", "Copywriting", "WordPress", "Ahrefs", "Editing", "Newsletters"],
    ["Rankings and reader growth prove the writing works.", "Elegant layout reflects a writer's eye for detail.", "Links to samples belong in the summary or contact line."],
    { projects: [["Writing portfolio", "15 published samples across blogs, landing pages and emails."]] }
  ),
  ex(
    "social-media-manager",
    "Social Media Manager",
    "Marketing & sales",
    "Mid-level",
    "spotlight",
    { name: "Riya Kapoor", location: "Mumbai" },
    "Social media manager with 5 years building communities for lifestyle brands. Creative ideas, backed by numbers.",
    [
      ["Social Media Manager", "Glow Cosmetics", "2022", "Present", ["Grew Instagram from 40,000 to 310,000 followers in 2 years", "Ran 25 creator campaigns with an average 6% engagement", "Lead a team of 3 designers and writers"]],
      ["Social Media Executive", "Brandwagon Agency", "2020", "2022", ["Managed 8 brand accounts across Instagram and YouTube"]],
    ],
    [["B.M.M. (Advertising)", "Mithibai College", "2017", "2020"]],
    ["Instagram", "YouTube", "Influencer marketing", "Content calendars", "Meta Business Suite", "Canva"],
    ["Follower and engagement growth are the headline numbers.", "Team leadership shows readiness for a manager role.", "Personal-brand layout suits the field."]
  ),
  ex(
    "brand-manager",
    "Brand Manager",
    "Marketing & sales",
    "Senior",
    "executive",
    { name: "Nikhil Sharma", location: "Mumbai" },
    "Brand manager with 9 years in FMCG, including 2 brand launches. I grow market share with sharp positioning and disciplined spends.",
    [
      ["Brand Manager", "Sunrise Foods", "2020", "Present", ["Grew market share of the flagship brand from 11% to 15% in 3 years", "Launched a health range that crossed ₹100 crore in its second year", "Own a ₹45 crore annual marketing budget"]],
      ["Assistant Brand Manager", "HomeCare Brands", "2017", "2020", ["Ran the relaunch of a household brand across 6 states"]],
    ],
    [["MBA, Marketing", "XLRI Jamshedpur", "2015", "2017"]],
    ["Brand strategy", "P&L ownership", "Consumer research", "Media planning", "Launches"],
    ["Market share and revenue are the language of FMCG leadership.", "Budget size shows the level of trust.", "Executive layout suits a senior role."]
  ),

  // ---------- Healthcare ----------
  ex(
    "staff-nurse",
    "Staff Nurse",
    "Healthcare",
    "Mid-level",
    "split",
    { name: "Jincy Thomas", location: "Kottayam", linkedin: false },
    "Registered staff nurse with 5 years in ICU and medical wards. Calm under pressure and careful with every chart.",
    [
      ["Staff Nurse, ICU", "St. Mary's Hospital", "2022", "Present", ["Care for up to 3 critical patients a shift on ventilators and monitors", "Trained 12 new nurses on infection-control protocols", "Part of the team that cut central-line infections by 40%"]],
      ["Staff Nurse, Medical Ward", "Mercy Hospital", "2020", "2022", ["Managed care for 10–12 patients a shift"]],
    ],
    [["B.Sc. Nursing", "Govt. College of Nursing, Kottayam", "2016", "2020"]],
    ["Critical care", "Ventilator care", "Infection control", "BLS & ACLS", "Patient education", "Documentation"],
    ["Patient load and outcomes show real responsibility.", "Registration and certifications are easy to find.", "Split layout keeps licences and skills in view."],
    { certs: [["Registered Nurse", "Kerala Nurses and Midwives Council", "2020"], ["ACLS Provider", "American Heart Association", "2023"]], languages: ["Malayalam", "English", "Hindi"] }
  ),
  ex(
    "pharmacist",
    "Pharmacist",
    "Healthcare",
    "Early career",
    "minimal",
    { name: "Mohammed Irfan", location: "Lucknow", linkedin: false },
    "Registered pharmacist with 3 years in hospital and retail pharmacy. Accurate dispensing and clear advice for patients.",
    [["Pharmacist", "Lifeline Hospital Pharmacy", "2022", "Present", ["Dispense 250+ prescriptions a day with zero dispensing errors flagged in audits", "Cut expired-stock losses by 22% with a first-expiry-first-out system", "Counsel patients on dosage and side effects"]]],
    [["B.Pharm", "Integral University, Lucknow", "2018", "2022"]],
    ["Dispensing", "Inventory management", "Drug interactions", "Patient counselling", "Pharmacy software"],
    ["Error-free dispensing is the most important proof in pharmacy.", "Inventory savings show business sense.", "Minimal layout is clean and professional."],
    { certs: [["Registered Pharmacist", "Uttar Pradesh State Pharmacy Council", "2022"]] }
  ),
  ex(
    "lab-technician",
    "Medical Lab Technician",
    "Healthcare",
    "Early career",
    "compact",
    { name: "Lakshmi Priya", location: "Madurai", linkedin: false },
    "Medical lab technician with 4 years in pathology labs. Precise with samples and quick with reports.",
    [["Lab Technician", "CarePath Diagnostics", "2021", "Present", ["Process 150+ blood and urine samples a day", "Run haematology and biochemistry analysers and daily quality controls", "Helped the lab pass its NABL audit with no major findings"]]],
    [["B.Sc. Medical Laboratory Technology", "Madurai Kamaraj University", "2018", "2021"]],
    ["Haematology", "Biochemistry", "Sample collection", "Quality control", "LIS software"],
    ["Daily volume and audit results show reliability.", "Equipment and tests are listed by name.", "Compact layout fits everything on one page."]
  ),

  // ---------- Skilled trades ----------
  ex(
    "iti-electrician",
    "Electrician (ITI)",
    "Skilled trades",
    "Mid-level",
    "classic",
    { name: "Suresh Kumar", location: "Hosur", linkedin: false },
    "Licensed electrician with 10 years keeping offices and factories running safely.",
    [
      ["Facilities Electrician", "Greenline Tech Park", "2019", "Present", ["Look after power systems for 3 office towers", "Cut breakdown calls by a third with monthly checks"]],
      ["Electrician", "Sri Lakshmi Electricals", "2014", "2019", ["Wired 150+ homes and shops to safety code"]],
    ],
    [["ITI, Electrician trade", "Govt ITI Hosur", "2012", "2014"]],
    ["Wiring", "Panel maintenance", "Lockout safety", "DG sets", "Team supervision"],
    ["Simple and clear, with the licence front and centre.", "Results are in plain words anyone can understand.", "Easy to make on a phone."],
    { certs: [["Licensed Electrician (Class B)", "State Electrical Licensing Board", "2014"]], languages: ["Tamil", "Kannada", "Hindi"] }
  ),
  ex(
    "iti-fitter",
    "Fitter (ITI)",
    "Skilled trades",
    "Early career",
    "ribbon",
    { name: "Ramesh Yadav", location: "Pune", linkedin: false },
    "ITI fitter with 4 years in automobile parts manufacturing. Careful with measurements and safety.",
    [["Fitter", "Precision Forgings (contract)", "2021", "Present", ["Assemble and fit machine parts to 0.02 mm tolerance", "Maintain 6 CNC machines; downtime down 15% after a new checklist", "Zero safety incidents in 4 years"]]],
    [["ITI, Fitter trade", "Govt ITI Aundh, Pune", "2019", "2021"], ["Class X", "Maharashtra State Board", "2017", "2019"]],
    ["Fitting", "Measuring tools", "CNC maintenance", "Reading drawings", "Safety (5S)"],
    ["Tolerance and safety record are exactly what supervisors look for.", "Short sentences, easy to read.", "Bold design stands out in a pile of plain resumes."],
    { certs: [["Apprenticeship Certificate (NAC)", "NCVT", "2021"]], languages: ["Hindi", "Marathi"] }
  ),
  ex(
    "automobile-mechanic",
    "Automobile Mechanic",
    "Skilled trades",
    "Mid-level",
    "fresher",
    { name: "Gurpreet Singh", location: "Ludhiana", linkedin: false },
    "Automobile mechanic with 7 years servicing cars at authorised dealers. Fast, honest diagnosis.",
    [
      ["Senior Technician", "Kohli Motors (authorised car service)", "2021", "Present", ["Service 8–10 cars a day with 95% first-time-fix rate", "Train 4 junior technicians", "Customer rating 4.7/5 on service feedback"]],
      ["Technician", "Local Car Workshop", "2017", "2021", ["Engine, brake and suspension repairs for all makes"]],
    ],
    [["ITI, Mechanic Motor Vehicle", "Govt ITI Ludhiana", "2015", "2017"]],
    ["Engine diagnostics", "OBD scanners", "Brakes & suspension", "AC repair", "Customer handling"],
    ["First-time-fix rate and customer rating show quality.", "Training juniors shows he's ready to lead.", "Clean layout works for workshops and dealers."],
    { certs: [["Certified Service Technician (Level 2)", "Manufacturer training academy", "2022"]], languages: ["Punjabi", "Hindi"] }
  ),
  ex(
    "hvac-technician",
    "AC & HVAC Technician",
    "Skilled trades",
    "Early career",
    "split",
    { name: "Abdul Rahman", location: "Bengaluru", linkedin: false },
    "HVAC technician with 5 years installing and servicing split ACs and commercial chillers. Ready to work in India or the Gulf.",
    [["HVAC Technician", "CoolAir Services", "2020", "Present", ["Install and service 30+ AC units a month for homes and offices", "Maintain chillers for 2 hospitals with no unplanned shutdowns", "Handle refrigerant gas safely and keep service logs"]]],
    [["ITI, Refrigeration and Air Conditioning", "Govt ITI Bengaluru", "2018", "2020"]],
    ["Split & VRF systems", "Chillers", "Refrigerant handling", "Electrical basics", "Preventive maintenance"],
    ["Mentions Gulf readiness, which matters to overseas recruiters.", "Hospital work shows trust in critical settings.", "Split layout shows skills at a glance."],
    { languages: ["Kannada", "Urdu", "Hindi", "English"] }
  ),

  // ---------- Operations & support ----------
  ex(
    "customer-support-executive",
    "Customer Support Executive",
    "Operations & support",
    "Early career",
    "modern",
    { name: "Pallavi Das", location: "Kolkata", linkedin: false },
    "Customer support executive with 3 years on voice, chat and email for an e-commerce brand. Patient, quick and good with angry customers.",
    [["Customer Support Executive", "QuickCart", "2022", "Present", ["Handle 70+ chats and calls a day with a 92% satisfaction score", "Resolved 85% of tickets on first contact", "Wrote 20 help-centre answers that cut repeat questions"]]],
    [["B.A.", "Calcutta University", "2018", "2021"]],
    ["Customer service", "Freshdesk", "Zendesk", "Complaint handling", "Typing 50 wpm"],
    ["Satisfaction and first-contact resolution are the numbers support managers track.", "Help-centre work shows initiative.", "Clear, friendly layout."],
    { languages: ["Bengali", "Hindi", "English"] }
  ),
  ex(
    "operations-manager",
    "Operations Manager",
    "Operations & support",
    "Senior",
    "grid",
    { name: "Sanjay Pillai", location: "Chennai" },
    "Operations manager with 10 years running warehouses and last-mile delivery. I make operations faster, cheaper and safer.",
    [
      ["Operations Manager", "SwiftShip Logistics", "2020", "Present", ["Run 3 warehouses and 450 delivery staff across Tamil Nadu", "Raised on-time delivery from 86% to 97%", "Cut cost per order by 14% with route planning"]],
      ["Warehouse Manager", "Mega Retail", "2016", "2020", ["Set up a new 80,000 sq ft warehouse in 4 months"]],
    ],
    [["MBA, Operations", "Loyola Institute of Business Administration", "2014", "2016"]],
    ["Warehouse management", "Last-mile delivery", "Lean", "SAP", "Team leadership", "Safety"],
    ["Scale (people, sites) and results (on-time, cost) are both clear.", "Grid layout organises a long career neatly.", "Shows a track record of setting things up from scratch."]
  ),
  ex(
    "supply-chain-executive",
    "Supply Chain Executive",
    "Operations & support",
    "Early career",
    "compact",
    { name: "Harsh Vardhan", location: "Indore" },
    "Supply chain executive with 3 years in procurement and inventory for a pharma company.",
    [["Supply Chain Executive", "MedLife Pharma", "2022", "Present", ["Manage purchase orders for 300+ raw materials", "Cut stock-outs by 40% with a reorder-level dashboard in Excel", "Negotiated 6% savings with 4 key suppliers"]]],
    [["MBA, Supply Chain Management", "Prestige Institute of Management", "2020", "2022"]],
    ["Procurement", "Inventory planning", "SAP MM", "Vendor negotiation", "Excel"],
    ["Stock-outs and savings are concrete wins.", "Industry tools (SAP MM) are named.", "Compact layout fits a focused early career."]
  ),
  ex(
    "bpo-to-data-analyst",
    "BPO to Data Analyst (career switch)",
    "Career changes",
    "Career change",
    "split",
    { name: "Arjun Desai", location: "Noida" },
    "Moving from BPO team leadership into data analysis. I've spent 4 years using call data to fix problems, and I've now trained in SQL, Python and Power BI.",
    [
      ["Team Leader, Customer Operations", "VoiceLink Services", "2022", "Present", ["Built an Excel tracker of call reasons that cut repeat calls by 18%", "Lead a team of 14 agents; team quality score rose from 78% to 91%"]],
      ["Customer Service Associate", "CallPoint BPO", "2020", "2022", ["Handled 90+ calls a day for a US telecom client"]],
    ],
    [["B.Com", "Delhi University (SOL)", "2017", "2020"]],
    ["SQL", "Python (pandas)", "Power BI", "Excel", "Data cleaning", "Dashboards"],
    ["Leads with data work he already did in the BPO job.", "Projects prove the new skills with real data.", "Summary explains the switch in one sentence."],
    {
      projects: [
        ["Call Centre Dashboard", "Power BI dashboard on 50,000 anonymised calls showing peak hours and top complaint reasons."],
        ["Delhi Air Quality Analysis", "Python analysis of 5 years of AQI data, published on GitHub."],
      ],
      certs: [["Google Data Analytics Professional Certificate", "Google / Coursera", "2025"]],
    }
  ),
  ex(
    "returning-after-career-break",
    "Returning to work after a career break",
    "Career changes",
    "Returning",
    "elegant",
    { name: "Fatima Khan", location: "Hyderabad" },
    "Chartered Accountant with 6 years in audit and tax, returning after a planned career break with refreshed GST and Ind AS training.",
    [
      ["Career break", "Family care", "2021", "2024", ["Completed GST certification and an Ind AS refresher in 2024", "Kept books for a local NGO as a volunteer"]],
      ["Audit Manager", "Rao and Associates", "2015", "2021", ["Led statutory audits for 20+ mid-size clients", "Trained 8 junior auditors on audit software"]],
    ],
    [["Chartered Accountant", "ICAI", "2012", "2015"]],
    ["Audit", "GST", "Ind AS", "Tally", "Excel"],
    ["Names the break honestly as its own entry - recruiters respect that.", "Shows recent learning so skills feel current.", "Earlier experience still gets full credit."],
    { certs: [["GST Certification", "ICAI", "2024"]] }
  ),
  ex(
    "teacher-to-instructional-designer",
    "Teacher to Instructional Designer",
    "Career changes",
    "Career change",
    "classic",
    { name: "Arjun Nair", location: "Kochi" },
    "Teacher of 7 years moving into corporate learning design. I turn complex topics into lessons people finish.",
    [
      ["Senior Science Teacher", "Greenfield School", "2018", "2025", ["Designed a 40-lesson blended course now used by 6 teachers", "Raised the class board-exam average from 68% to 81%"]],
      ["Freelance Course Designer", "Self-employed", "2024", "Present", ["Built 3 short online courses for an edtech startup"]],
    ],
    [["M.Sc. Physics", "Calicut University", "2014", "2016"], ["B.Ed.", "Calicut University", "2016", "2017"]],
    ["Storyboarding", "Articulate 360", "Canva", "Training delivery", "Assessment design"],
    ["Teaching results are framed in learning-design terms.", "Freelance work proves the new skills.", "Summary makes the switch obvious."]
  ),

  // ---------- Education & design ----------
  ex(
    "school-teacher",
    "School Teacher",
    "Education & design",
    "Mid-level",
    "scholar",
    { name: "Shalini Verma", location: "Bhopal", linkedin: false },
    "Mathematics teacher with 8 years teaching classes 9–12 (CBSE). I make maths less scary and results better.",
    [["PGT Mathematics", "Greenwood Public School, Bhopal", "2018", "Present", ["Class 12 maths average rose from 71% to 84% over 3 years", "Started a weekly doubt-clearing club attended by 60+ students", "Coordinate the school's Olympiad programme"]]],
    [["M.Sc. Mathematics", "Barkatullah University", "2014", "2016"], ["B.Ed.", "Barkatullah University", "2016", "2017"]],
    ["CBSE curriculum", "Lesson planning", "Smart-class tools", "Olympiad coaching", "Parent communication"],
    ["Results are measured in student marks, the clearest proof for schools.", "Extra roles show commitment beyond the classroom.", "Scholarly layout suits teaching."],
    { certs: [["CTET (Paper II)", "CBSE", "2017"]], achievements: ["Best Teacher Award, Greenwood Public School, 2023"] }
  ),
  ex(
    "graphic-designer",
    "Graphic Designer",
    "Education & design",
    "Early career",
    "spotlight",
    { name: "Zoya Hussain", location: "Delhi" },
    "Graphic designer with 4 years in brand identity and social content for startups. Bold ideas, clean execution.",
    [["Graphic Designer", "Studio Mango", "2021", "Present", ["Designed brand identities for 18 startups, 4 of which raised funding with the new brand", "Created 1,000+ social posts and ad creatives", "Built a design template system that halved turnaround time"]]],
    [["B.Des. Communication Design", "Pearl Academy", "2017", "2021"]],
    ["Adobe Illustrator", "Photoshop", "Figma", "Branding", "Typography", "Motion basics"],
    ["Portfolio link is the most important part - keep it in the contact line.", "Volume and business results both shown.", "Spotlight layout shows personality."],
    { projects: [["Portfolio", "Behance portfolio with 12 case studies."]] }
  ),
  ex(
    "ux-designer",
    "UX Designer",
    "Education & design",
    "Mid-level",
    "modern",
    { name: "Aisha Mehra", location: "Bengaluru" },
    "Product designer with 5 years designing mobile apps for fintech and health. I test early and design for real people, including first-time smartphone users.",
    [
      ["Product Designer", "HealthFirst", "2022", "Present", ["Redesigned appointment booking; completion rose from 52% to 79%", "Ran 40+ user interviews in 4 languages"]],
      ["UX Designer", "PayNest", "2020", "2022", ["Designed the onboarding flow for 3 million new users"]],
    ],
    [["M.Des. Interaction Design", "IDC School of Design, IIT Bombay", "2018", "2020"]],
    ["User research", "Figma", "Prototyping", "Usability testing", "Design systems", "Accessibility"],
    ["Each project ends with a measurable result.", "Research in local languages is a strong differentiator in India.", "Modern layout fits a design role."]
  ),
];

export const EXAMPLE_CATEGORIES: ExampleCategory[] = [
  "Students & freshers",
  "Tech",
  "Business & finance",
  "Marketing & sales",
  "Healthcare",
  "Skilled trades",
  "Operations & support",
  "Education & design",
  "Career changes",
];

export function getExample(slug: string) {
  return EXAMPLES.find((e) => e.slug === slug);
}
