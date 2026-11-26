import { OG_IMAGE } from "@/lib/og";
import type { Metadata } from "next";
import { featurePage } from "@/lib/feature-pages";
import { FeaturePreviewPage } from "@/components/marketing/FeaturePreviewPage";

const page = featurePage("linkedin-optimizer");

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: "/linkedin-optimizer" },
  openGraph: { images: [OG_IMAGE], title: page.title, description: page.metaDescription, url: "/linkedin-optimizer" },
};

export default function Page() {
  return <FeaturePreviewPage page={page} />;
}
