/** The Lettr services and template options, shared by the public header and the builders. */
export type ServiceItem = {
  href: string;
  label: string;
  note: string;
  /** Set for services that live inside the resume editor: the editor switches to this tab instead of leaving the page. */
  tab?: "match" | "tailor" | "cover-letter" | "resignation-letter";
};

export const SERVICES: ServiceItem[] = [
  { href: "/builder/new", label: "Resume builder", note: "Templates, colours, PDF and Word export" },
  { href: "/resume-checker", label: "ATS resume checker", note: "ATS score, keywords and AI analyst", tab: "match" },
  { href: "/tools/bullet-writer", label: "AI resume help", note: "Rewrites, fixer, tailoring and agent", tab: "tailor" },
  { href: "/tools/cover-letter-writer", label: "Cover letters", note: "AI-written, with designs", tab: "cover-letter" },
  { href: "/dashboard/linkedin", label: "LinkedIn optimizer", note: "Rewrite your profile" },
  { href: "/dashboard/interview", label: "Interview practice", note: "AI feedback on your answers" },
  { href: "/dashboard", label: "Resignation letters", note: "Open a resume, then pick Resignation", tab: "resignation-letter" },
  { href: "/dashboard/applications", label: "Job tracker", note: "Follow every application" },
];

/** Template options. Country and fresher links open the gallery directly. */
export const TEMPLATE_LINKS: ServiceItem[] = [
  { href: "/templates", label: "Resume templates", note: "ATS-friendly designs" },
  { href: "/templates?for=freshers", label: "Fresher templates", note: "For your first job" },
  { href: "/templates?country=in", label: "India templates", note: "Shown with an Indian resume" },
  { href: "/templates?country=us", label: "USA templates", note: "Shown with a US resume" },
  { href: "/templates?country=uk", label: "UK templates", note: "Shown with a UK CV" },
  { href: "/resume-builder", label: "More countries", note: "Canada, Australia and others" },
  { href: "/tools/cover-letter-writer", label: "Cover letter designs", note: "10 designs to choose from" },
  { href: "/dashboard", label: "Resignation letter designs", note: "Pick one in your editor" },
  { href: "/examples", label: "Resume examples", note: "For jobs, freshers to senior" },
];
