import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { COMPANY, operatorName } from "@/lib/company";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Lettr",
  description: "How Lettr Pro passes, cancellations and refunds work.",
  alternates: { canonical: "/refund-policy" },
  robots: { index: true, follow: true },
};

const mail = COMPANY.contactEmail ? (
  <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>
) : (
  <Link href={COMPANY.contactUrl}>our help page</Link>
);

const SECTIONS: LegalSection[] = [
  {
    id: "passes",
    title: "How Pro is sold",
    body: (
      <p>
        Lettr Pro is sold as one-time passes for 1, 3 or 12 months, with prices on our{" "}
        <Link href="/pricing">pricing page</Link>. A pass is a single payment. It does not renew automatically, and you are
        never charged again unless you buy another pass.
      </p>
    ),
  },
  {
    id: "auto-renew",
    title: "Auto-renewing monthly plan",
    body: (
      <p>
        Where it's offered, you can instead choose a monthly plan that renews automatically. We email you 3 days before each
        renewal, and you can cancel any time from your dashboard, after which you won&apos;t be charged again and Pro runs
        until the end of the month already paid for. If you&apos;re charged twice or by mistake, tell us within 7 days and
        we&apos;ll refund it.
      </p>
    ),
  },
  {
    id: "cancellation",
    title: "Cancellation",
    body: (
      <p>
        Because passes don&apos;t renew, there is nothing to cancel. Pro simply ends at the end of the time you paid for, and
        your account moves to the free plan with all your resumes kept. We email you a few days before it ends.
      </p>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <>
        <p>
          You can try every Pro feature on the free plan before paying, so passes are not refundable once Pro has started,
          except where the law requires it.
        </p>
        <p>
          If you were charged twice, charged in error, or paid but Pro didn&apos;t switch on and we can&apos;t fix it, email{" "}
          {mail} within 7 days of the payment with the email on your account. Approved refunds are sent back to the
          original payment method within 5–7 working days; your bank may take a little longer to show it.
        </p>
      </>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Lettr is run by {operatorName()}. Questions about a payment: {mail} or our <Link href="/support">help page</Link>.
      </p>
    ),
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      title="Cancellation & Refund Policy"
      updated="17 October 2026"
      intro={<p>Short and plain: what you pay for, when it ends, and when you get money back.</p>}
      sections={SECTIONS}
    />
  );
}
