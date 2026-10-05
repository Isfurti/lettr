import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { ResumeShot } from "@/components/home/ResumeShot";
import { HERO_EXAMPLE } from "@/lib/home-examples";

const PERKS = [
  "Free to start. No card needed.",
  "See what's weak and fix it with AI.",
  "Match your resume to any job post.",
];

/** Shared frame for sign-in, sign-up and password pages: the form card plus a friendly side panel on wide screens. */
export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  showSide = true,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  showSide?: boolean;
}) {
  return (
    <>
      <PublicNav />
      <main className="flex-1 bg-cream text-ink px-4 py-10 sm:py-16 overflow-x-clip">
        <div
          className={`max-w-[1120px] mx-auto grid gap-12 items-center ${showSide ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]" : ""}`}
        >
          <div className="rise w-full max-w-[460px] mx-auto bg-white border-2 border-ink rounded-[32px] shadow-[8px_8px_0_var(--ink)] p-7 sm:p-10">
            {eyebrow && (
              <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-brand-blue mb-2">{eyebrow}</p>
            )}
            <h1 className="font-brand font-extrabold text-[32px] sm:text-[36px] leading-[1.05] tracking-tight">{title}</h1>
            {subtitle && <div className="mt-2 text-slate">{subtitle}</div>}
            <div className="mt-8">{children}</div>
          </div>

          {showSide && (
            <aside
              aria-hidden="true"
              className="hidden lg:flex relative bg-ink text-white rounded-[36px] p-10 min-h-[560px] flex-col justify-between overflow-hidden"
            >
              <span className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-brand-blue/40" />
              <span className="absolute -left-10 -bottom-12 w-48 h-48 rounded-full bg-gold/20" />
              <div className="relative">
                <p className="font-brand font-extrabold text-[34px] leading-[1.05] tracking-tight">
                  Make your resume impossible to skip.
                </p>
                <ul className="mt-6 space-y-3">
                  {PERKS.map((p) => (
                    <li key={p} className="flex items-center gap-3 text-white/85">
                      <span className="w-6 h-6 shrink-0 rounded-full bg-gold text-ink flex items-center justify-center">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 6 9 17l-5-5" />
                        </svg>
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative self-end mt-8 float-tilted">
                <ResumeShot template="modern" data={HERO_EXAMPLE} width={280} />
                <div className="absolute -left-6 -top-5 w-[84px] h-[84px] rounded-full bg-gold text-ink flex flex-col items-center justify-center rotate-[-8deg] shadow-[0_6px_0_var(--gold-deep)]">
                  <span className="font-brand font-extrabold text-[30px] leading-none">92</span>
                  <span className="text-[10px] font-extrabold mt-0.5">Resume score</span>
                </div>
              </div>
            </aside>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

/** A single centered card under the public nav, for short status pages (reset links, email verification). */
export function CardPage({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="flex-1 bg-cream text-ink flex items-center justify-center px-4 py-14 sm:py-20">
        <div className="rise w-full max-w-[440px] bg-white border-2 border-ink rounded-[32px] shadow-[8px_8px_0_var(--ink)] p-7 sm:p-10">
          {children}
        </div>
      </main>
      <Footer />
    </>
  );
}
