import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { getProfile, getResume, getUserById, listOriginalResumeTitles } from "@/lib/db";
import { formatProDate } from "@/lib/pro-pass";
import type { Plan } from "@/lib/limits";
import { parseStoredResume } from "@/lib/resume-version";
import { profileUrl } from "@/lib/profile-consent";
import { AppSidebar } from "@/components/AppSidebar";
import { ProfileSettings, type ProfileView } from "@/components/profile/ProfileSettings";

export const metadata: Metadata = { title: "My profile | Lettr", robots: { index: false } };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const [user, profile, resumes] = await Promise.all([getUserById(userId), getProfile(userId), listOriginalResumeTitles(userId)]);
  const plan = (user?.plan ?? "free") as Plan;
  const chosen = profile?.resume_id ?? resumes[0]?.id;
  const resume = chosen ? await getResume(chosen, userId) : undefined;
  const name = resume ? (parseStoredResume(resume.data).contact?.fullName ?? "") : "";

  const initial: ProfileView | null = profile
    ? {
        resumeId: profile.resume_id,
        shared: profile.shared,
        url: profile.shared && profile.slug ? profileUrl(profile.slug) : null,
        showCity: profile.show_city,
        showLinks: profile.show_links,
        showContact: profile.show_contact,
        showPersonal: profile.show_personal,
        hasPhoto: profile.has_photo,
        photoVersion: profile.photo_etag,
        takenDown: Boolean(profile.disabled_at),
      }
    : null;

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-cream text-ink">
      <AppSidebar isAdmin={isAdminEmail(session.user.email)} plan={plan} proUntil={plan === "pro" && user?.pro_until ? formatProDate(user.pro_until) : null} />
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-10 w-full">
        <h1 className="font-brand font-extrabold text-[32px] sm:text-[44px] leading-tight tracking-tight">My profile</h1>
        <p className="text-lg text-slate mt-1 mb-7 max-w-2xl">Your profile is one of your resumes. Change the resume and the profile changes with it. It is private until you share it.</p>
        <ProfileSettings initial={initial} resumes={resumes} name={name} />
      </main>
    </div>
  );
}
