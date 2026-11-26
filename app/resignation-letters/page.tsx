import { OG_IMAGE } from "@/lib/og";
import type { Metadata } from "next";
import { featurePage } from "@/lib/feature-pages";
import { FeaturePreviewPage } from "@/components/marketing/FeaturePreviewPage";

const page = featurePage("resignation-letters");

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: "/resignation-letters" },
  openGraph: { images: [OG_IMAGE], title: page.title, description: page.metaDescription, url: "/resignation-letters" },
};

export default function Page() {
  return <FeaturePreviewPage page={page} />;
}
