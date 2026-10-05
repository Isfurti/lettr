import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = { title: "Page not found | Lettr" };

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col bg-cream text-ink">
      <PublicNav />
      <main className="flex-1 flex items-center justify-center px-4 py-20 sm:py-28">
        <div className="text-center max-w-lg rise">
          <div className="mx-auto mb-8 w-[120px] h-[120px] rounded-full border-[3px] border-dashed border-[#A3AEC6] flex flex-col items-center justify-center rotate-[-6deg]">
            <span className="font-brand font-extrabold text-[44px] leading-none">404</span>
            <span className="text-xs font-bold text-slate mt-1">Page not found</span>
          </div>
          <h1 className="font-brand font-extrabold text-[36px] sm:text-[48px] leading-[1.05] tracking-tight">
            We couldn&apos;t find that page.
          </h1>
          <p className="mt-4 text-lg text-slate">The link may be old or mistyped. Here are some good places to go instead.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/"
              className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)]"
            >
              Go to homepage
            </Link>
            <Link href="/builder/new" className="btn-press inline-flex items-center min-h-12 px-6 rounded-full bg-white border-2 border-ink font-bold">
              Build a resume
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
