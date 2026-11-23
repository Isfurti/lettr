import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfileBySlug } from "@/lib/db";
import { ReportProfileForm } from "@/components/profile/ReportProfileForm";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Report a profile | Lettr",
  robots: { index: false, follow: false, noarchive: true },
  referrer: "no-referrer",
};

/** Reports are only for live profiles; anything else is the same 404 as the profile itself. */
export default async function ReportProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const src = await getPublicProfileBySlug(slug);
  if (!src) notFound();
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col gap-5 bg-[#fffdf8] px-5 py-10 text-[#041632]">
      <h1 className="font-brand text-[32px] font-extrabold leading-tight">Report this profile</h1>
      <p className="text-[#27344f]">Tell us what is wrong. A person at Lettr reads every report and can turn the profile off.</p>
      <ReportProfileForm slug={slug} />
    </main>
  );
}
