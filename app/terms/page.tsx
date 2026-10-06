import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { COMPANY } from "@/lib/company";
import { PLAN_LIMITS } from "@/lib/limits";

export const metadata: Metadata = {
  title: "Terms of Service | Lettr",
  description: "The terms that govern your use of Lettr, a product of Noonscope Media Pvt. Ltd.",
  alternates: { canonical: "/terms" },
  robots: { index: true, follow: true },
};

const mail = <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>;

const SECTIONS: LegalSection[] = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <>
        <p>
          Lettr is a product of <strong>{COMPANY.legalName}</strong>, a company registered in India with its office at{" "}
          {COMPANY.addressLines.join(", ")} (&quot;Lettr&quot;, &quot;we&quot;, &quot;us&quot;).
        </p>
        <p>
          These terms apply to the Lettr website and app. By creating an account or using Lettr, you agree to them. If you
          don&apos;t agree, please don&apos;t use Lettr.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who can use Lettr",
    body: (
      <>
        <p>
          You must be at least 18 years old to create an account. You can try parts of Lettr without an account, such as
          the builder and the free resume checker.
        </p>
        <p>
          Keep your login details safe. You&apos;re responsible for what happens in your account. Tell us at {mail} if you
          think someone else has used it.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "What Lettr does",
    body: (
      <>
        <p>
          Lettr helps you write, score and format resumes, compare them with job posts, and write cover and resignation
          letters. Lettr is a writing tool. It is not a recruiter or a job board, and it can&apos;t promise you an interview
          or a job.
        </p>
        <p>
          We keep improving Lettr, so features, templates and limits may change. If a change takes away something
          important that you&apos;ve paid for, we&apos;ll tell you first.
        </p>
      </>
    ),
  },
  {
    id: "your-content",
    title: "Your content",
    body: (
      <>
        <p>
          You own your resumes, letters and anything else you write or upload. You give us permission to store and process
          that content only so we can run Lettr for you: saving it, showing previews, creating PDFs and Word files, and
          sending the relevant text to our AI provider when you use an AI feature.
        </p>
        <p>
          You&apos;re responsible for what you put in your resume. Only include true information about yourself and content
          you have the right to use.
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI suggestions",
    body: (
      <>
        <p>
          AI features suggest wording. They can make mistakes. When a number would help but you haven&apos;t given one,
          Lettr leaves a blank like [X]% for you to fill in. Always check suggestions before you use them. You are
          responsible for the final resume or letter you send to anyone.
        </p>
        <p>
          The resume score, job match and reading checks are guides to help you improve. Employers and their hiring
          software use their own rules, which we don&apos;t control.
        </p>
      </>
    ),
  },
  {
    id: "plans",
    title: "Plans, prices and GST",
    body: (
      <>
        <p>
          The Free plan includes {PLAN_LIMITS.free.maxResumes} resume, {PLAN_LIMITS.free.maxPdfDownloads} PDF downloads,{" "}
          {PLAN_LIMITS.free.maxAiWritingAssists} AI rewrites and the Classic and Modern templates. Pro unlocks the rest. The
          plans on offer (for example Monthly, a 3-month pass and Yearly) and their prices are shown on our{" "}
          <Link href="/pricing">pricing page</Link>.
        </p>
        <p>
          Prices are set for your country. Prices in Indian rupees include GST. Whether a plan renews automatically, and
          when, is shown at checkout before you pay. Payments are handled by our payment provider, which is named at
          checkout. We don&apos;t see or store your full card or bank details.
        </p>
        <p>
          For payments in India we issue a GST invoice in the name of {COMPANY.legalName}. Business customers can add
          their GSTIN at checkout.
        </p>
        <p>
          If we change the price of a plan you already pay for, the new price applies from your next renewal, and
          we&apos;ll tell you before it does.
        </p>
      </>
    ),
  },
  {
    id: "cancel-refunds",
    title: "Cancelling and refunds",
    body: (
      <>
        <p>
          You can cancel a renewing plan at any time from your dashboard. You keep Pro until the end of the period you
          already paid for, and you won&apos;t be charged again.
        </p>
        <p>
          Payments are not refundable for time already started, except where the law requires it or where we made a
          mistake. If you were charged twice or charged in error, email {mail} within 7 days and we&apos;ll refund it.
        </p>
      </>
    ),
  },
  {
    id: "fair-use",
    title: "Fair use",
    body: (
      <>
        <p>&quot;Unlimited&quot; Pro features are for one person&apos;s normal job search. Please don&apos;t:</p>
        <ul>
          <li>share your account, or resell or automate Lettr;</li>
          <li>use the AI features for things unrelated to careers and job applications;</li>
          <li>create false credentials, impersonate someone, or upload someone else&apos;s data without permission;</li>
          <li>try to break, overload or copy Lettr, or get around its limits.</li>
        </ul>
        <p>
          To keep Lettr fast and affordable for everyone, we may slow down or limit unusually heavy AI use, and we may
          suspend accounts that break these rules.
        </p>
      </>
    ),
  },
  {
    id: "our-content",
    title: "Lettr's templates and content",
    body: (
      <p>
        The Lettr app, templates, designs, example resumes and brand belong to {COMPANY.legalName}. You can use them to
        create and send your own resumes and letters, including PDFs you download. You can&apos;t copy or resell the
        templates or the app itself. The example resumes are made-up people and are there to show style only.
      </p>
    ),
  },
  {
    id: "ending",
    title: "Ending your account",
    body: (
      <>
        <p>
          You can delete your account at any time from your dashboard. This deletes your resumes too, and can&apos;t be
          undone.
        </p>
        <p>
          We may suspend or close an account that breaks these terms or the law, or if we have to stop offering Lettr.
          Where we reasonably can, we&apos;ll warn you first and give you time to download your resumes.
        </p>
      </>
    ),
  },
  {
    id: "liability",
    title: "Our responsibility to you",
    body: (
      <>
        <p>
          We work hard to keep Lettr available and accurate, but it is provided &quot;as is&quot;. We don&apos;t guarantee
          it will always be available or free of errors.
        </p>
        <p>
          As far as the law allows, we aren&apos;t responsible for indirect losses, such as a missed job opportunity, and
          our total responsibility to you is limited to the amount you paid us in the 12 months before the problem. Nothing
          in these terms limits rights you have under Indian consumer law that can&apos;t be limited.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Law and disputes",
    body: (
      <p>
        These terms are governed by the laws of India. If we can&apos;t sort out a problem together, the courts at{" "}
        {COMPANY.city}, {COMPANY.state} will have jurisdiction, without affecting any right you have to go to a consumer
        forum where you live.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms as Lettr changes. We&apos;ll update the date at the top, and tell you by email or in the
        app before any important change affects you.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact and grievances",
    body: (
      <>
        <p>
          Questions or complaints: email {mail} or use our <Link href="/support">help page</Link>.
        </p>
        <p>
          Grievance officer: <strong>{COMPANY.grievanceOfficer.name}</strong>, {COMPANY.legalName},{" "}
          {COMPANY.addressLines.join(", ")}. Email:{" "}
          <a href={`mailto:${COMPANY.grievanceOfficer.email}`}>{COMPANY.grievanceOfficer.email}</a>. We acknowledge
          complaints within 48 hours and aim to resolve them within one month.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updated="6 October 2026"
      intro={<p>The rules for using Lettr, in plain language. Please read them before you sign up or pay.</p>}
      sections={SECTIONS}
    />
  );
}
