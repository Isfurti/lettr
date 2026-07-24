import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listResumesForUser, getUserById } from "@/lib/db";
import { PLAN_LIMITS, type Plan } from "@/lib/limits";
import { NewResumeButton } from "@/components/NewResumeButton";
import { SignOutButton } from "@/components/SignOutButton";
import { BillingPortalButton } from "@/components/BillingPortalButton";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ drive_connected?: string; drive_error?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const [resumes, user] = await Promise.all([listResumesForUser(userId), getUserById(userId)]);
  const plan = (user?.plan ?? "free") as Plan;
  const resumeLimit = PLAN_LIMITS[plan].maxResumes;
  const atResumeLimit = resumes.length >= resumeLimit;
  const { drive_connected, drive_error } = await searchParams;

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-12">
      {drive_connected && (
        <div className="mb-6 bg-seal-soft text-seal text-sm rounded-sm px-4 py-3">
          Google Drive connected. You can now save resumes straight to Drive from the builder.
        </div>
      )}
      {drive_error && (
        <div className="mb-6 bg-red-50 text-red-700 text-sm rounded-sm px-4 py-3">
          Couldn&apos;t connect Google Drive ({drive_error}). Please try again.
        </div>
      )}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-seal font-mono mb-1">Dashboard</p>
          <h1 className="font-display font-bold text-2xl">Your resumes</h1>
        </div>
        <div className="flex items-center gap-3">
          {!atResumeLimit && <NewResumeButton />}
          <SignOutButton />
        </div>
      </div>

      <div className="flex items-center justify-between mb-10 text-sm">
        <p className="text-ink-soft">
          <span className={`font-mono uppercase text-xs px-2 py-0.5 rounded-sm mr-2 ${plan === "pro" ? "bg-seal-soft text-seal" : "bg-rule/30"}`}>
            {plan}
          </span>
          {plan === "free" && (
            <span>
              {resumes.length} / {resumeLimit} resume{resumeLimit === 1 ? "" : "s"} used
            </span>
          )}
        </p>
        {plan === "free" ? (
          <Link href="/pricing" className="text-seal hover:underline">
            Upgrade to Pro →
          </Link>
        ) : (
          <BillingPortalButton />
        )}
      </div>

      {resumes.length === 0 ? (
        <div className="paper-sheet rounded-sm p-10 text-center">
          <p className="text-ink-soft mb-4">You haven&apos;t created a resume yet.</p>
          <NewResumeButton label="Create your first resume" />
        </div>
      ) : (
        <ul className="grid sm:grid-cols-2 gap-4">
          {resumes.map((r) => (
            <li key={r.id}>
              <Link
                href={`/builder/${r.id}`}
                className="block paper-sheet rounded-sm p-5 hover:-translate-y-0.5 transition-transform"
              >
                <p className="font-display font-bold">{r.title}</p>
                <p className="text-xs text-ink-soft mt-1 font-mono">
                  Updated {new Date(r.updated_at).toLocaleDateString()}
                </p>
                <p className="text-xs text-seal mt-3 uppercase tracking-wide font-mono">{r.template}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {atResumeLimit && (
        <div className="paper-sheet rounded-sm p-6 mt-6 text-center">
          <p className="text-sm text-ink-soft mb-3">
            You&apos;ve used your free resume. Upgrade to Pro for unlimited resumes.
          </p>
          <Link href="/pricing" className="text-seal font-medium hover:underline">
            View plans →
          </Link>
        </div>
      )}
    </main>
  );
}
