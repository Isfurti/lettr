/**
 * Country pages for English-speaking job markets (/resume-builder/[country]).
 * Each entry holds only things that are broadly true for that market, worded
 * with "usually" and "often" where employers differ. No prices anywhere.
 * Europe is left out on purpose for now.
 */
export type Country = {
  slug: string;
  name: string;
  /** What job seekers call the document. */
  term: "resume" | "CV";
  /** Other word people search for. */
  alt: "resume" | "CV";
  /** Open Graph locale, e.g. en_US. */
  locale: string;
  paper: "A4" | "US Letter";
  length: string;
  photo: string;
  personal: string;
  spelling: string;
  references: string;
  tips: string[];
  examples: string[];
};

const DEFAULT_EXAMPLES = ["digital-marketing-executive", "data-analyst", "customer-support-executive"];

export const COUNTRIES: Country[] = [
  {
    slug: "usa",
    name: "the USA",
    term: "resume",
    alt: "CV",
    locale: "en_US",
    paper: "US Letter",
    length: "One page is the norm. Two pages only with many years of experience.",
    photo: "No photo. US employers avoid them.",
    personal: "Leave off date of birth, marital status, nationality and religion.",
    spelling: "American spelling (organize, color, center).",
    references: "Skip \"references available on request\". Employers ask when they need them.",
    tips: [
      "Lead each bullet with a verb and end with a number: how much, how many, how fast.",
      "Copy the exact keywords from the job post into your skills and bullets. Most US employers screen with ATS software.",
      "Use city and state (Austin, TX) in your contact line. A full street address isn't needed.",
    ],
    examples: ["software-engineer-usa", "project-manager-canada", "data-analyst"],
  },
  {
    slug: "canada",
    name: "Canada",
    term: "resume",
    alt: "CV",
    locale: "en_CA",
    paper: "US Letter",
    length: "One to two pages. One page early in your career.",
    photo: "No photo.",
    personal: "Leave off date of birth, marital status and your social insurance number.",
    spelling: "Canadian spelling: mostly American (organize) with some British (colour, centre).",
    references: "Usually \"available on request\", or a short separate list if the employer asks.",
    tips: [
      "Mention your work authorization in one line if it helps, for example \"Authorized to work in Canada\".",
      "Put Canadian employers and volunteering first if you're new to the country, and show results in numbers.",
      "In Quebec, employers often expect a French version. Lettr writes in the language you type.",
    ],
    examples: ["project-manager-canada", "software-engineer-usa", "data-analyst"],
  },
  {
    slug: "uk",
    name: "the UK",
    term: "CV",
    alt: "resume",
    locale: "en_GB",
    paper: "A4",
    length: "Two pages is normal. One page for graduates and school leavers.",
    photo: "No photo.",
    personal: "Leave off date of birth, marital status and nationality.",
    spelling: "British spelling (organise, colour, centre).",
    references: "Leave \"references available on request\" off. Employers ask later.",
    tips: [
      "Start with a short personal profile of three or four lines, tailored to the job.",
      "List education with your classification, for example 2:1 or First, if it is strong.",
      "Use real job-advert words in your skills and experience so recruiters' software finds you.",
    ],
    examples: ["data-analyst-uk", "registered-nurse-uk-nhs", "data-analyst"],
  },
  {
    slug: "australia",
    name: "Australia",
    term: "resume",
    alt: "CV",
    locale: "en_AU",
    paper: "A4",
    length: "Two to three pages is accepted. Keep it tight, and shorter early in your career.",
    photo: "No photo.",
    personal: "Leave off date of birth and marital status. Work rights or visa status are often stated.",
    spelling: "British-style spelling (organise, colour, centre).",
    references: "Two referees are often listed with name, role and phone, or \"available on request\".",
    tips: [
      "State your work rights near the top if you hold a visa or are a citizen or permanent resident.",
      "Show achievements, not just duties, with figures where you can.",
      "Add your referees' details only after asking them. Employers in Australia do call.",
    ],
    examples: ["civil-engineer-australia", "project-manager-canada", "data-analyst"],
  },
  {
    slug: "new-zealand",
    name: "New Zealand",
    term: "CV",
    alt: "resume",
    locale: "en_NZ",
    paper: "A4",
    length: "Two to three pages is common.",
    photo: "No photo.",
    personal: "Leave off date of birth and marital status. Say if you have the right to work in New Zealand.",
    spelling: "British-style spelling (organise, colour, centre).",
    references: "Two or three referees are usually listed. Ask them first.",
    tips: [
      "State your right to work in New Zealand clearly, especially if you are applying from overseas.",
      "Keep a plain, single-column layout so applicant tracking software reads every line.",
      "Add volunteering and community work. Employers there value it.",
    ],
    examples: DEFAULT_EXAMPLES,
  },
  {
    slug: "singapore",
    name: "Singapore",
    term: "resume",
    alt: "CV",
    locale: "en_SG",
    paper: "A4",
    length: "One to two pages.",
    photo: "A photo is optional and less common than it used to be. Leave it off unless the employer asks.",
    personal: "Employers often like to know your work status: citizen, permanent resident or pass holder.",
    spelling: "British-style spelling (organise, programme).",
    references: "\"Available on request\" is fine.",
    tips: [
      "Put your work status near your contact details so recruiters see it at once.",
      "Mention expected or notice period only if the job post asks for it.",
      "Show regional experience and the tools you use, with measurable results.",
    ],
    examples: ["marketing-manager-singapore", "data-analyst", "financial-analyst"],
  },
  {
    slug: "south-africa",
    name: "South Africa",
    term: "CV",
    alt: "resume",
    locale: "en_ZA",
    paper: "A4",
    length: "Two to three pages is common.",
    photo: "A photo is optional. Many people leave it off.",
    personal: "Keep personal details short. Languages and a driver's licence are often useful to add.",
    spelling: "British-style spelling (organise, colour).",
    references: "Two or three references are often listed. Ask them before you do.",
    tips: [
      "List the languages you speak with your level. It matters in many South African roles.",
      "Add a driver's licence line if the job involves travel.",
      "Name your qualifications in full, with the institution and year.",
    ],
    examples: DEFAULT_EXAMPLES,
  },
  {
    slug: "nigeria",
    name: "Nigeria",
    term: "CV",
    alt: "resume",
    locale: "en_NG",
    paper: "A4",
    length: "Two pages is a good target.",
    photo: "A photo is optional. Leave it off unless the employer asks.",
    personal: "Keep personal details short. Graduates often mention NYSC status.",
    spelling: "British spelling (organise, colour).",
    references: "Two referees are often listed, or \"available on request\".",
    tips: [
      "Graduates can mention NYSC completion or exemption on one line.",
      "Lead with results and numbers, not duties. Job posts get many applications.",
      "Mirror the words in the job post so the right keywords appear in your CV.",
    ],
    examples: DEFAULT_EXAMPLES,
  },
  {
    slug: "kenya",
    name: "Kenya",
    term: "CV",
    alt: "resume",
    locale: "en_KE",
    paper: "A4",
    length: "Two pages is a good target.",
    photo: "A photo is optional. Leave it off unless the employer asks.",
    personal: "Keep personal details short. Name, phone, email and town are enough.",
    spelling: "British spelling (organise, colour).",
    references: "Two or three referees are often listed. Ask them first.",
    tips: [
      "Put your referees on a separate line or page with name, role, company and phone.",
      "Lead each job with achievements and figures, not a list of duties.",
      "Add certifications and training that match the job post.",
    ],
    examples: DEFAULT_EXAMPLES,
  },
  {
    slug: "philippines",
    name: "the Philippines",
    term: "resume",
    alt: "CV",
    locale: "en_PH",
    paper: "A4",
    length: "One to two pages.",
    photo: "A small photo has been common. It is optional, and most international employers don't need one.",
    personal: "Age and civil status were traditionally listed. You can leave them off, and employers rarely mind.",
    spelling: "American spelling is common.",
    references: "\"Available on request\" or two named references.",
    tips: [
      "Applying to overseas or BPO employers? Keep one clean column and plain headings so ATS software reads it.",
      "Show your results and the tools you use, such as CRM, Excel or ticketing systems.",
      "Add your English level only if the job asks. Your writing already shows it.",
    ],
    examples: ["customer-support-executive", "bpo-to-data-analyst", "data-analyst"],
  },
  {
    slug: "india",
    name: "India",
    term: "resume",
    alt: "CV",
    locale: "en_IN",
    paper: "A4",
    length: "One page is enough under about 8 years of experience.",
    photo: "A photo is optional and not needed.",
    personal: "A phone number matters. Date of birth and marital status are not needed.",
    spelling: "British-style spelling (organise, colour).",
    references: "Leave them off.",
    tips: [
      "Put a working phone number and your current city at the top. Indian recruiters often call first.",
      "Freshers: lead with projects, internships and skills, and keep it to one page.",
      "Mention notice period only if the employer asks for it.",
    ],
    examples: ["software-engineer", "digital-marketing-executive", "campus-placement-software-engineer"],
  },
];

export function getCountry(slug: string): Country | undefined {
  return COUNTRIES.find((c) => c.slug === slug);
}

/** The word to use in headings, capitalised for CV and lowercase for resume. */
export function docWord(c: Country): string {
  return c.term === "CV" ? "CV" : "resume";
}
