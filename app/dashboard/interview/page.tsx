import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { getUserById, listInterviewSessions, listResumesForUser } from "@/lib/db";
import { displayTitle } from "@/lib/resume-title";
import { PLAN_LIMITS, type Plan } from "@/lib/limits";
import { usageContext, usedSoFar } from "@/lib/free-usage";
import type { ResumeData } from "@/lib/types";
import { AppSidebar } from "@/components/AppSidebar";
import { StartInterview } from "@/components/interview/InterviewPractice";

export const metadata: Metadata = { title: "Interview practice | Lettr", robots: { index: false } };

export default async function InterviewPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const [user, rows, sessions] = await Promise.all([getUserById(userId), listResumesForUser(userId), listInterviewSessions(userId)]);
  const plan = (user?.plan ?? "free") as Plan;
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });
  const usedSets = await usedSoFar(ctx, "interview");
  const resumes = rows.map((r) => ({ ...r, data: JSON.parse(r.data) as ResumeData }));
  const defaultRole = resumes.map((r) => r.data.experience[0]?.role?.trim()).find(Boolean) ?? "";
  const limit = PLAN_LIMITS[ctx.tier].interviewSets;
  const left = Math.max(0, limit - usedSets);

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-cream text-ink">
      <AppSidebar isAdmin={isAdminEmail(session.user.email)} plan={plan} isPaidPro={plan === "pro" && Boolean(user?.stripe_subscription_id)} />
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1100px] w-full">
        <h1 className="font-brand font-extrabold text-[32px] sm:text-[44px] leading-tight tracking-tight">Interview practice</h1>
        <p className="text-lg text-slate mt-1 mb-7">Practise the questions you&apos;re likely to get, and walk in prepared.</p>

        <StartInterview
          resumes={resumes.map((r) => ({ id: r.id, title: displayTitle(r) }))}
          defaultRole={defaultRole}
          limitNote={
            ctx.tier === "free"
              ? left > 0
                ? "Your free practice interview: 6 questions with feedback on each answer."
                : "You've used your free practice interview. Pro gives you 40 a month."
              : ctx.tier === "free_legacy"
                ? `${left} of ${limit} free practice interviews left this month.`
                : `${left} left this month.`
          }
        />

        <section className="mt-10">
          <h2 className="font-brand font-extrabold text-2xl mb-4">Your practice interviews</h2>
          {sessions.length === 0 ? (
            <p className="text-slate">None yet. Your first one takes about 10 minutes.</p>
          ) : (
            <ul className="grid sm:grid-cols-2 gap-3">
              {sessions.map((s) => {
                const scored = s.questions.filter((q) => q.feedback);
                const avg = scored.length ? Math.round((scored.reduce((n, q) => n + (q.feedback?.score ?? 0), 0) / scored.length) * 10) / 10 : null;
                return (
                  <li key={s.id}>
                    <Link href={`/dashboard/interview/${s.id}`} className="block bg-white border-2 border-rule rounded-2xl p-4 hover:border-ink">
                      <p className="font-extrabold">{s.role}{s.company ? ` · ${s.company}` : ""}</p>
                      <p className="text-sm text-slate mt-1">
                        {scored.length} of {s.questions.length} answered{avg !== null ? ` · average ${avg}/10` : ""} ·{" "}
                        {new Date(s.updated_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </p>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
