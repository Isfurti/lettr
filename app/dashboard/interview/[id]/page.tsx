import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { getInterviewSession, getUserById } from "@/lib/db";
import { AppSidebar } from "@/components/AppSidebar";
import { InterviewSession } from "@/components/interview/InterviewPractice";

export const metadata: Metadata = { title: "Interview practice | Lettr", robots: { index: false } };

export default async function InterviewSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const { id } = await params;
  const [user, practice] = await Promise.all([getUserById(userId), getInterviewSession(userId, id)]);
  if (!practice) notFound();
  const plan = user?.plan ?? "free";

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-cream text-ink">
      <AppSidebar isAdmin={isAdminEmail(session.user.email)} plan={plan} isPaidPro={plan === "pro" && Boolean(user?.stripe_subscription_id)} />
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1200px] w-full">
        <Link href="/dashboard/interview" className="inline-flex items-center min-h-11 text-sm font-bold text-slate hover:text-ink">
          ← All practice interviews
        </Link>
        <h1 className="font-brand font-extrabold text-[28px] sm:text-[36px] leading-tight tracking-tight mb-6">
          Practice: {practice.role}
        </h1>
        <InterviewSession initial={practice} />
      </main>
    </div>
  );
}
