import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { COMPANY, SELLER } from "@/lib/company";

export const metadata: Metadata = {
  title: "Privacy Policy | Lettr",
  description: "How Lettr collects, uses and protects your data, and the rights you have over it.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

// Until Lettr has a public email address, people reach us through the help page.
const mail = COMPANY.contactEmail ? (
  <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>
) : (
  <Link href={COMPANY.contactUrl}>our help page</Link>
);

const SECTIONS: LegalSection[] = [
  {
    id: "who",
    title: "Who looks after your data",
    body: (
      <p>
        {SELLER ? (
          <>
            Lettr is run by <strong>{SELLER.legalName}</strong>, {SELLER.addressLines.join(", ")}.
          </>
        ) : (
          <>Lettr is an online resume builder made in India.</>
        )}{" "}
        We decide how your
        personal data is used for Lettr, so we are responsible for it (the &quot;data fiduciary&quot; under India&apos;s
        Digital Personal Data Protection Act, 2023, and the &quot;controller&quot; under the EU and UK GDPR).
      </p>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <ul>
        <li>
          <strong>Account details:</strong> your name and email, and a password stored only as a secure hash. If you sign
          in with Google or LinkedIn, we receive your name and email from them.
        </li>
        <li>
          <strong>Resume content:</strong> what you type into Lettr, such as contact details, work history, education,
          skills and an optional photo.
        </li>
        <li>
          <strong>Files you upload:</strong> resumes and LinkedIn PDFs you import or check. We read the text from the file
          and don&apos;t keep the file itself. When you import, the resume we build from it is saved to your account. The
          free checker doesn&apos;t save anything.
        </li>
        <li>
          <strong>Job posts and letter details</strong> you paste in for job match, cover letters or resignation letters.
          Job match runs in your browser; letters are sent to our AI provider to write the draft.
        </li>
        <li>
          <strong>Usage records:</strong> things like when you created, imported or downloaded a resume, how many AI
          rewrites and downloads you&apos;ve used, and when you were last active. These run your plan limits and help us
          support you.
        </li>
        <li>
          <strong>Applications and interview practice:</strong> the jobs you track (company, role, dates, notes, job posts)
          and your practice interview questions, answers and feedback. Only you can see them.
        </li>
        <li>
          <strong>Saved AI results:</strong> a copy of a cover letter or resume import, so if you ask again with the same
          resume and job post you get it instantly. Kept for up to 30 days and deleted with your account.
        </li>
        <li>
          <strong>Your country:</strong> worked out from your internet address so we can show the right price. We save the
          country, not the address.
        </li>
        <li>
          <strong>Security data:</strong> to stop abuse of free tools, we keep a scrambled (hashed) version of your
          internet address for a short time. We can&apos;t turn it back into the real address.
        </li>
        <li>
          <strong>Messages and reviews:</strong> support messages and feedback you send us.
        </li>
        <li>
          <strong>Payment details:</strong> handled by our payment provider. We keep your plan, payment status and invoices,
          never your full card or bank details.
        </li>
        <li>
          <strong>Google Drive:</strong> if you connect it, we store a permission token so we can save files Lettr creates
          to your Drive. We can&apos;t see your other Drive files.
        </li>
      </ul>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <>
        <ul>
          <li>to run Lettr: saving resumes, previews, PDFs and Word files, scores and AI features;</li>
          <li>to manage your account, plan, payments and GST invoices;</li>
          <li>to send account emails, like email verification, password resets and replies to your messages;</li>
          <li>to keep Lettr safe, prevent abuse and fix errors;</li>
          <li>to understand, in total, how Lettr is used so we can improve it.</li>
        </ul>
        <p>
          We use your data because you asked us to provide Lettr (your consent and our agreement with you), to meet legal
          duties such as keeping tax records, and for the safety of the service.
        </p>
        <p>
          <strong>We don&apos;t sell your data.</strong> We don&apos;t show ads, and we don&apos;t share your resume with
          employers or recruiters unless you send it to them yourself.
        </p>
      </>
    ),
  },
  {
    id: "ai",
    title: "AI features",
    body: (
      <>
        <p>
          When you use an AI feature (rewrites, summaries, the AI Resume Agent, cover and resignation letters, imports, the
          resume checker, the ATS score analyst, interview practice and replies to your reviews), we send only the text that job
          needs to our AI provider, Anthropic. It sends back a
          suggestion. Anthropic doesn&apos;t use this content to train its models.
        </p>
        <p>
          We don&apos;t use your resumes to train AI. To see whether suggestions are useful, we count whether each AI
          suggestion was kept, edited or rejected (no text).
        </p>
        <p>
          If you turn on <strong>Help improve Lettr&apos;s AI</strong> (Dashboard → Account; it&apos;s off by default), we also keep
          examples of suggestions you keep or edit, with your name, employers, email addresses, phone numbers and links removed, to
          make future suggestions better. You can turn it off at any time, and the examples kept from you are deleted.
        </p>
      </>
    ),
  },
  {
    id: "public",
    title: "Reviews and what others can see",
    body: (
      <p>
        Your resumes are private to your account. Reviews you leave are only shown on our website if you tick the box
        agreeing to it, and then only with your first name.
      </p>
    ),
  },
  {
    id: "team",
    title: "Who at Lettr can see your data",
    body: (
      <p>
        A small number of authorised team members can see account details, usage records and resumes when needed to
        support you, fix a problem or prevent abuse. Admin actions are logged.
      </p>
    ),
  },
  {
    id: "providers",
    title: "Service providers",
    body: (
      <>
        <p>We use trusted companies to run parts of Lettr. They may only use your data to provide their service to us:</p>
        <ul>
          <li><strong>Vercel</strong>: hosting the website and app;</li>
          <li><strong>our database provider</strong>: storing account and resume data;</li>
          <li><strong>Anthropic</strong>: AI features;</li>
          <li><strong>our payment provider</strong> (named at checkout): taking payments;</li>
          <li><strong>Google</strong> and <strong>LinkedIn</strong>: sign-in, and Google Drive if you connect it;</li>
          <li><strong>Resend</strong>: sending emails;</li>
          <li><strong>Sentry</strong>: error reports so we can fix bugs.</li>
        </ul>
      </>
    ),
  },
  {
    id: "where",
    title: "Where your data is stored",
    body: (
      <p>
        Some of these providers store or process data outside India, for example in the United States or Europe. We only
        use providers with strong security, and we follow Indian law on sending data abroad. For users in the EU or UK, we
        rely on safeguards the law recognises, such as standard contractual clauses.
      </p>
    ),
  },
  {
    id: "storage",
    title: "Cookies and browser storage",
    body: (
      <>
        <p>
          We use a few cookies that are needed to sign you in and keep your account secure. We don&apos;t use advertising
          or tracking cookies.
        </p>
        <p>
          On the free plan we also set one cookie with a random code for your browser. Together with a one-way scrambled
          code of your email address (we can&apos;t turn it back into the address), it lets us give each person their free
          AI uses once, rather than once per account. These codes are kept after you delete your account, without your
          name, email or anything else about you, so the free allowance isn&apos;t reused.
        </p>
        <p>
          If you build a resume without an account, your draft is saved in your own browser (local storage) so you
          don&apos;t lose it. It stays on your device until you sign up or clear your browser data.
        </p>
      </>
    ),
  },
  {
    id: "keep",
    title: "How long we keep data",
    body: (
      <ul>
        <li>Account and resumes: until you delete them or your account.</li>
        <li>Saved AI results (cover letters and imports): up to 30 days, or until you delete your account.</li>
        <li>Tracked applications and practice interviews: until you delete them or your account.</li>
        <li>
          When you delete your account, we delete your account, resumes and usage records straight away. Copies in backups
          are removed as those backups expire.
        </li>
        <li>Invoices and payment records: as long as tax law requires (currently up to 8 years).</li>
        <li>Support messages: as long as needed to deal with your request.</li>
        <li>Records of admin actions: kept for security, even after an account is deleted.</li>
        <li>Hashed internet addresses used against abuse: a few days.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>You can:</p>
        <ul>
          <li>see and correct your data, most of it directly in Lettr;</li>
          <li>delete your resumes or your whole account yourself from your dashboard;</li>
          <li>withdraw your consent at any time (we&apos;ll stop the processing that relies on it);</li>
          <li>ask for a summary of the data we hold about you and who we&apos;ve shared it with;</li>
          <li>nominate someone to exercise your rights if you die or can&apos;t act yourself;</li>
          <li>complain to us (see below), and then to the Data Protection Board of India.</li>
        </ul>
        <p>
          If you&apos;re in the EU or UK, you also have the GDPR rights to get a copy of your data in a portable format, to
          object to or restrict some processing, and to complain to your local data protection authority.
        </p>
        <p>To use any of these rights, contact us through {mail}. We&apos;ll reply within 30 days.</p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        Lettr accounts are for people aged 18 and over. We don&apos;t knowingly collect data from children. If you think a
        child has signed up, tell us and we&apos;ll delete the account.
      </p>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use encryption in transit, hashed passwords, access controls and limits on who can see data. No system is
        perfectly secure; if a breach affects you, we&apos;ll tell you and the authorities as the law requires.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        We&apos;ll update this page when we change how we use data, and tell you by email or in the app before any
        important change affects you.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact and grievance officer",
    body: (
      <>
        <p>
          Grievance officer: <strong>{COMPANY.grievanceOfficer.name}</strong>
          {SELLER ? `, ${SELLER.legalName}, ${SELLER.addressLines.join(", ")}` : ""}. Contact: {mail}.
        </p>
        <p>
          We acknowledge complaints within 48 hours and aim to resolve them within one month. You can also reach us through
          our <Link href="/support">help page</Link>.
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updated="8 October 2026"
      intro={<p>What we collect, why, who helps us, and the control you have. We&apos;ve kept it as plain as we can.</p>}
      sections={SECTIONS}
    />
  );
}
