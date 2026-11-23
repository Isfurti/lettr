import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfileBySlug } from "@/lib/db";
import { buildPublicProfile, profileTitle } from "@/lib/public-profile";
import { PublicProfileView } from "@/components/profile/PublicProfileView";

// Read on every request: a revoked or taken-down link must stop working at once.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

/** Same answer for "never existed", "revoked" and "taken down", so a link tells nobody which. */
async function load(slug: string) {
  const src = await getPublicProfileBySlug(slug);
  if (!src) return null;
  try {
    return { src, profile: buildPublicProfile(src) };
  } catch {
    return null; // data this version cannot read: show nothing rather than half a page
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const found = await load(slug);
  // Never listed by search engines or archives, and the preview text carries no details beyond a name and a job title.
  const robots = { index: false, follow: false, noarchive: true, nosnippet: true, noimageindex: true } as const;
  if (!found || !found.profile.name) return { title: "Profile not found | Lettr", robots };
  const title = `${profileTitle(found.profile)} | Lettr`;
  return {
    title,
    description: "A resume shared on Lettr.",
    robots,
    alternates: {},
    openGraph: { title, description: "A resume shared on Lettr.", type: "profile", siteName: "Lettr" },
    twitter: { card: "summary", title, description: "A resume shared on Lettr." },
  };
}

export default async function PublicProfilePage({ params }: Props) {
  const { slug } = await params;
  const found = await load(slug);
  if (!found || !found.profile.name) notFound();
  const { profile } = found;
  const photoSrc = `/p/${slug}/photo?v=${encodeURIComponent(profile.photoVersion)}`;
  return <PublicProfileView profile={profile} photoSrc={photoSrc} />;
}
