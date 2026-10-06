import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { getUserById, listReviewsForUser } from "@/lib/db";
import { formatDate } from "@/lib/format-date";
import { AppSidebar } from "@/components/AppSidebar";
import { FeedbackForm } from "@/components/FeedbackForm";

export const metadata: Metadata = { title: "Feedback | Lettr", robots: { index: false } };

export default async function FeedbackPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const [user, pastReviews] = await Promise.all([getUserById(userId), listReviewsForUser(userId)]);

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-cream text-ink">
      <AppSidebar
        eyebrow="Resume workspace"
        isAdmin={isAdminEmail(session.user.email)}
        plan={user?.plan ?? "free"}
        isPaidPro={user?.plan === "pro" && Boolean(user?.stripe_subscription_id)}
      />
      <main className="flex-1 min-w-0 px-4 sm:px-10 py-6 sm:py-10 max-w-xl w-full">
        <h1 className="font-brand font-extrabold text-[32px] sm:text-[40px] leading-tight tracking-tight mb-2">How&apos;s Lettr working for you?</h1>
        <p className="text-ink-soft mb-8">
          Tell us what&apos;s working and what isn&apos;t — a real person reads every one, and our team follows
          up on real feedback.
        </p>
        <FeedbackForm />

        {pastReviews.length > 0 && (
          <section className="mt-10">
            <h2 className="font-display font-semibold text-lg mb-3">Your past feedback</h2>
            <div className="space-y-3">
              {pastReviews.map((r) => (
                <div key={r.id} className="bg-white border border-rule rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-gold-deep" aria-label={`${r.rating} out of 5`}>
                      {"★".repeat(r.rating)}
                      <span className="text-rule">{"★".repeat(5 - r.rating)}</span>
                    </span>
                    <span className="text-xs text-ink-soft">{formatDate(r.created_at)}</span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{r.content}</p>
                  {r.ai_reply ? (
                    <p className="text-sm text-slate mt-3 pt-3 border-t border-rule">
                      <span className="font-bold text-brand-blue">Lettr replied: </span>
                      {r.ai_reply}
                    </p>
                  ) : (
                    <p className="text-xs text-ink-soft mt-3">Our reply is on its way.</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
