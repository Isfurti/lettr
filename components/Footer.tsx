import Link from "next/link";
import { Logo } from "@/components/Logo";
import { COMPANY } from "@/lib/company";

const COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/builder/new", label: "Resume builder" },
      { href: "/resume-checker", label: "Free resume checker" },
      { href: "/templates", label: "Templates" },
      { href: "/examples", label: "Resume examples" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Help",
    links: [
      { href: "/support", label: "Support" },
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
  {
    title: "Account",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/signup", label: "Create account" },
    ],
  },
];

/** The one site footer - used on every public page so links and labels never drift apart. */
export function Footer() {
  return (
    <footer className="border-t border-rule bg-cream">
      <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-14 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1 flex flex-col gap-3">
          <Logo />
          <p className="text-sm text-slate">Made in India for job seekers everywhere.</p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.title}>
            <p className="text-sm font-bold mb-2">{col.title}</p>
            <div className="flex flex-col text-[15px] text-slate">
              {col.links.map((l) => (
                <Link key={l.href} href={l.href} className="py-1.5 hover:text-brand-blue transition-colors">
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-rule">
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-14 py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate">
          <p>
            © {new Date().getFullYear()} Lettr is a product of <span className="font-bold text-ink">{COMPANY.legalName}</span>,{" "}
            {COMPANY.addressLines.join(", ")}. GSTIN {COMPANY.gstin}.
          </p>
          <a href={`mailto:${COMPANY.contactEmail}`} className="inline-flex items-center min-h-10 font-bold hover:text-brand-blue">
            {COMPANY.contactEmail}
          </a>
        </div>
      </div>
    </footer>
  );
}
