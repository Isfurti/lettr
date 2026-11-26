import { OG_IMAGE } from "@/lib/og";
import type { Metadata } from "next";
import { featurePage } from "@/lib/feature-pages";
import { FeaturePreviewPage } from "@/components/marketing/FeaturePreviewPage";

const page = featurePage("job-tracker");

export const metadata: Metadata = {
  title: page.metaTitle,
  description: page.metaDescription,
  alternates: { canonical: "/job-tracker" },
  openGraph: { images: [OG_IMAGE], title: page.title, description: page.metaDescription, url: "/job-tracker" },
};

export default function Page() {
  return <FeaturePreviewPage page={page} />;
}
