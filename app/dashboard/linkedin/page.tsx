import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdminEmail } from "@/lib/admin-auth";
import { getUserById, listResumesForUser } from "@/lib/db";
import { displayTitle } from "@/lib/resume-title";
import { PLAN_LIMITS, type Plan } from "@/lib/limits";
import { usageContext, usedSoFar } from "@/lib/free-usage";
import { AppSidebar } from "@/components/AppSidebar";
import { formatProDate } from "@/lib/pro-pass";
import { LinkedInOptimizer } from "@/components/linkedin/LinkedInOptimizer";
import { linkedinFromResume } from "@/lib/linkedin";
import { parseStoredResume } from "@/lib/resume-version";
import { marketFromCountry, marketOf } from "@/lib/market";

export const metadata: Metadata = { title: "LinkedIn profile | Lettr", robots: { index: false } };

export default async function LinkedInPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;
  const [user, rows] = await Promise.all([getUserById(userId), listResumesForUser(userId)]);
  const plan = (user?.plan ?? "free") as Plan;
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });
  const used = await usedSoFar(ctx, "linkedin");
  const limit = PLAN_LIMITS[ctx.tier].linkedin;
  const originals = rows.filter((r) => !r.parent_id).map((r) => ({ ...r, data: parseStoredResume(r.data) }));
  const first = originals[0]?.data;

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-cream text-ink">
      <AppSidebar isAdmin={isAdminEmail(session.user.email)} plan={plan} proUntil={plan === "pro" && user?.pro_until ? formatProDate(user.pro_until) : null} />
      <main className="flex-1 min-w-0 px-4 sm:px-8 lg:px-12 py-6 sm:py-10 max-w-[1100px] w-full">
        <h1 className="font-brand font-extrabold text-[32px] sm:text-[44px] leading-tight tracking-tight">LinkedIn profile</h1>
        <p className="text-lg text-slate mt-1 mb-7">Get a better headline, About and experience. Lettr cannot read or change your LinkedIn page: you paste your text, and copy the result back yourself.</p>
        {ctx.tier !== "pro" ? (
          <div className="bg-white border-2 border-rule rounded-[28px] p-6 sm:p-8 max-w-xl">
            <p className="font-extrabold text-xl">The LinkedIn profile tools are a Pro feature</p>
            <p className="mt-2 text-slate">Get a profile score, stronger headlines, an About rewrite and better experience lines, using only what you wrote. Lettr never reads or changes your LinkedIn page.</p>
            <Link href="/pricing" className="btn-press mt-5 inline-flex items-center min-h-12 px-7 rounded-full bg-gold text-ink font-extrabold shadow-[0_5px_0_var(--gold-deep)]">See Pro</Link>
          </div>
        ) : (
        <LinkedInOptimizer
          resumes={originals.map((r) => ({ id: r.id, title: displayTitle(r), sections: linkedinFromResume(r.data) }))}
          defaultRole={first?.experience[0]?.role?.trim() ?? ""}
          defaultMarket={(first && marketOf(first.customization)) || marketFromCountry(user?.country_code) || "IN"}
          allowance={{ used, limit: Number.isFinite(limit) ? limit : null, tier: ctx.tier }}
        />
        )}
      </main>
    </div>
  );
}
