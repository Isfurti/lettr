import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, type LegalSection } from "@/components/LegalPage";
import { COMPANY, operatorName } from "@/lib/company";

export const metadata: Metadata = {
  title: "Delivery Policy | Lettr",
  description: "How and when Lettr Pro is delivered after you pay.",
  alternates: { canonical: "/delivery-policy" },
  robots: { index: true, follow: true },
};

const mail = COMPANY.contactEmail ? (
  <a href={`mailto:${COMPANY.contactEmail}`}>{COMPANY.contactEmail}</a>
) : (
  <Link href={COMPANY.contactUrl}>our help page</Link>
);

const SECTIONS: LegalSection[] = [
  {
    id: "digital",
    title: "Online service only",
    body: (
      <p>
        Lettr is an online resume builder. Nothing is shipped: there are no physical goods and no shipping charges. Pro is
        delivered to your Lettr account at getlettr.com.
      </p>
    ),
  },
  {
    id: "when",
    title: "When you get Pro",
    body: (
      <p>
        Pro switches on as soon as your payment goes through, usually within seconds. You get a confirmation email, and the
        GST invoice is on your dashboard. Your resumes and downloads are available straight away, on any device you sign in
        on.
      </p>
    ),
  },
  {
    id: "problems",
    title: "If something goes wrong",
    body: (
      <p>
        If you paid and Pro hasn&apos;t switched on within 30 minutes, email {mail} with the email on your account and we&apos;ll
        sort it out, or refund you under our <Link href="/refund-policy">refund policy</Link>. Lettr is run by {operatorName()}.
      </p>
    ),
  },
];

export default function DeliveryPolicyPage() {
  return (
    <LegalPage
      title="Delivery Policy"
      updated="17 October 2026"
      intro={<p>How Lettr Pro reaches you after you pay.</p>}
      sections={SECTIONS}
    />
  );
}
