import type { Metadata } from "next";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";
import { ExamplesGallery } from "@/components/examples/ExamplesGallery";
import { EXAMPLES, EXAMPLE_CATEGORIES } from "@/lib/examples";

export const metadata: Metadata = {
  title: `Resume Examples for ${EXAMPLES.length}+ Jobs (Freshers to Senior) | Lettr`,
  description:
    "Resume examples for freshers, campus placements, CA, nurses, ITI trades, BPO to analyst and more. See what good looks like, then use any example as your starting point.",
  alternates: { canonical: "/examples" },
};

export default function ExamplesPage() {
  return (
    <div className="flex-1 flex flex-col bg-cream text-ink">
      <PublicNav />
      <main className="flex-1 max-w-[1280px] mx-auto w-full px-4 sm:px-8 lg:px-14 py-10 sm:py-16">
        <div className="max-w-2xl mb-10 rise">
          <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-brand-blue mb-3">Resume examples</p>
          <h1 className="font-brand font-extrabold text-[40px] sm:text-[56px] leading-[1.02] tracking-tight">
            See what good looks like.
          </h1>
          <p className="mt-5 text-lg text-slate leading-relaxed">
            {EXAMPLES.length} example resumes, from campus placements and ITI trades to CAs and product managers. Pick one
            close to your job, then make it yours in the builder.
          </p>
          <p className="mt-3 text-sm text-slate">
            Every example is a made-up person. Swap in your own details and real numbers.
          </p>
        </div>
        <ExamplesGallery examples={EXAMPLES} categories={EXAMPLE_CATEGORIES} />
      </main>
      <Footer />
    </div>
  );
}
