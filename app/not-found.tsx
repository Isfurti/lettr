import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = { title: "Page not found | Lettr" };

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col bg-paper">
      <PublicNav />
      <main className="flex-1 flex items-center justify-center px-4 py-24">
        <div className="text-center max-w-md">
          <p className="font-mono text-sm text-seal mb-3">404</p>
          <h1 className="font-display font-semibold text-3xl mb-3">We couldn&apos;t find that page.</h1>
          <p className="text-ink-soft mb-8">
            The link may be old or mistyped. Here are some good places to go instead.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/" className="bg-ink text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:opacity-90">
              Go to homepage
            </Link>
            <Link href="/builder/new" className="border border-rule px-5 py-2.5 rounded-sm text-sm font-medium hover:bg-paper-raised">
              Build a resume
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
