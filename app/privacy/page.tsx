import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { PublicNav } from "@/components/PublicNav";

export const metadata: Metadata = {
  title: "Privacy Policy | Lettr",
  description: "How Lettr collects, uses, and protects your data.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
  return (
    <main className="flex-1 flex flex-col bg-cream text-ink">
      <PublicNav />
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-8 py-12 sm:py-16 flex-1">
        <p className="text-sm font-extrabold uppercase tracking-[0.12em] text-brand-blue mb-3">Legal</p>
        <h1 className="font-brand font-extrabold text-[40px] sm:text-[52px] leading-[1.02] tracking-tight mb-3">Privacy Policy</h1>
        <p className="inline-block bg-gold-soft text-sm font-bold px-3 py-1 rounded-full mb-10">Last updated: July 2026</p>

        <div className="prose-content bg-white border border-rule rounded-[28px] p-6 sm:p-10 space-y-8 text-[16px] leading-relaxed">
          <section>
            <h2 className="font-brand font-extrabold text-xl tracking-tight mb-2">What we collect</h2>
            <p className="text-slate">
              When you create an account, we store your name, email address, and a hashed
              (never plain-text) password. When you build a resume, we store the resume content
              you enter — contact details, work experience, education, and skills — tied to your
              account.
            </p>
          </section>

          <section>
            <h2 className="font-brand font-extrabold text-xl tracking-tight mb-2">How AI features work</h2>
            <p className="text-slate">
              Features like bullet rewriting, the AI Resume Agent, cover letters, and resignation
              letters send the relevant resume text to Anthropic&apos;s API to generate results. This
              content is used to generate your response and is subject to Anthropic&apos;s own data
              handling terms as our processor — we don&apos;t control or separately store what
              happens on their side beyond what's needed to return a result to you.
            </p>
          </section>

          <section>
            <h2 className="font-brand font-extrabold text-xl tracking-tight mb-2">Third-party services we use</h2>
            <ul className="list-disc pl-5 text-slate space-y-1.5">
              <li><strong>Anthropic</strong> — powers AI writing features</li>
              <li><strong>Stripe</strong> — processes payments for Pro subscriptions; we never see or store your full card details</li>
              <li><strong>Google Drive</strong> — only if you explicitly connect it, to save a resume PDF to your own Drive. We request the minimum scope needed (access only to files we create) and never read your existing Drive contents</li>
              <li><strong>Sentry</strong> — error monitoring, to help us catch and fix bugs</li>
              <li><strong>Resend</strong> — sends email notifications for support messages, if configured</li>
            </ul>
          </section>

          <section>
            <h2 className="font-brand font-extrabold text-xl tracking-tight mb-2">What we don&apos;t do</h2>
            <p className="text-slate">
              We don&apos;t sell your data. We don&apos;t share your resume content with employers,
              recruiters, or any third party except the processors listed above, and only as
              needed to operate the service.
            </p>
          </section>

          <section>
            <h2 className="font-brand font-extrabold text-xl tracking-tight mb-2">Your data, your control</h2>
            <p className="text-slate">
              You can delete any resume at any time from your dashboard, and delete your whole account
              yourself from the Account section at the bottom of your dashboard. If you need help, contact
              us via{" "}
              <Link href="/support" className="font-bold text-brand-blue hover:underline">the support page</Link>.
            </p>
          </section>

          <section>
            <h2 className="font-brand font-extrabold text-xl tracking-tight mb-2">Cookies</h2>
            <p className="text-slate">
              We use a single session cookie to keep you logged in. We don&apos;t use advertising
              or tracking cookies.
            </p>
          </section>

          <section>
            <h2 className="font-brand font-extrabold text-xl tracking-tight mb-2">Questions</h2>
            <p className="text-slate">
              Reach out any time via <Link href="/support" className="font-bold text-brand-blue hover:underline">our support page</Link>.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </main>
  );
}
