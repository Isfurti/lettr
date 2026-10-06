import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { getUserById, listApplications, listResumesForUser } from "@/lib/db";
import { displayTitle } from "@/lib/resume-title";
import type { ResumeData } from "@/lib/types";
import { AppSidebar } from "@/components/AppSidebar";
import { ApplicationsBoard } from "@/components/applications/ApplicationsBoard";

export const metadata: Metadata = { title: "Applications | Lettr", robots: { index: false } };

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const [user, apps, resumes] = await Promise.all([getUserById(userId), listApplications(userId), listResumesForUser(userId)]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-cream text-ink">
      <AppSidebar
        isAdmin={isAdminEmail(session.user.email)}
        plan={user?.plan ?? "free"}
        isPaidPro={user?.plan === "pro" && Boolean(user?.stripe_subscription_id)}
      />
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1400px] w-full">
        <h1 className="font-brand font-extrabold text-[32px] sm:text-[44px] leading-tight tracking-tight">Applications</h1>
        <p className="text-lg text-slate mt-1 mb-7">Every job you&apos;re going for, and what to do next. Free on every plan.</p>
        <ApplicationsBoard
          initial={apps}
          resumes={resumes.map((r) => ({ id: r.id, title: displayTitle({ ...r, data: JSON.parse(r.data) as ResumeData }) }))}
        />
      </main>
    </div>
  );
}
