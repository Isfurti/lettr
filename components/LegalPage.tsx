import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";

export type LegalSection = { id: string; title: string; body: React.ReactNode };

/** Shared layout for Terms and Privacy: title, date, contents list and numbered sections. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
}: {
  title: string;
  updated: string;
  intro: React.ReactNode;
  sections: LegalSection[];
}) {
  return (
    <main className="flex-1 flex flex-col bg-cream text-ink">
      <PublicNav />
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-12 sm:py-16 flex-1">
        <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-brand-blue mb-3">Legal</p>
        <h1 className="font-brand font-extrabold text-[40px] sm:text-[52px] leading-[1.02] tracking-tight mb-3">{title}</h1>
        <p className="inline-block bg-gold-soft text-sm font-bold px-3 py-1 rounded-full mb-6">Last updated: {updated}</p>
        <div className="text-lg text-slate leading-relaxed mb-8">{intro}</div>

        <nav aria-label="Contents" className="bg-white border border-rule rounded-[24px] p-5 sm:p-6 mb-6">
          <p className="font-extrabold mb-2">Contents</p>
          <ol className="grid sm:grid-cols-2 gap-x-6 text-[15px]">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="inline-flex min-h-10 items-center text-brand-blue font-bold hover:underline">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="legal-body bg-white border border-rule rounded-[28px] p-6 sm:p-10 space-y-9 text-[16px] leading-relaxed text-slate">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-6">
              <h2 className="font-brand font-extrabold text-xl tracking-tight mb-3 text-ink">
                {i + 1}. {s.title}
              </h2>
              <div className="space-y-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_strong]:text-ink [&_a]:font-bold [&_a]:text-brand-blue hover:[&_a]:underline">
                {s.body}
              </div>
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  );
}
