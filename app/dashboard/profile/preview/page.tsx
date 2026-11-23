import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getProfile, getResume } from "@/lib/db";
import { buildPublicProfile } from "@/lib/public-profile";
import { ownerSource } from "@/lib/profile-source";
import { PublicProfileView } from "@/components/profile/PublicProfileView";

export const metadata: Metadata = { title: "Profile preview | Lettr", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** Exactly what visitors would see, built the same way, from the owner's current settings. Only the owner can open it. */
export default async function ProfilePreviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const profile = await getProfile(userId);
  if (!profile?.resume_id) redirect("/dashboard/profile");
  const resume = await getResume(profile.resume_id, userId);
  if (!resume || resume.parent_id) redirect("/dashboard/profile");

  let view;
  try {
    view = buildPublicProfile(ownerSource(userId, profile, resume));
  } catch {
    redirect("/dashboard/profile"); // saved data this version cannot read
  }

  return (
    <>
      <div className="bg-[#041632] px-5 py-3 text-center text-sm font-bold text-[#fffdf8]">
        Preview: only you can see this page.{" "}
        <a href="/dashboard/profile" className="text-[#ffc94d] underline">Back to my profile</a>
      </div>
      <PublicProfileView
        profile={view}
        photoSrc={`/api/profile/photo?v=${encodeURIComponent(view.photoVersion)}`}
        footer={<span>This is a preview.</span>}
      />
    </>
  );
}
