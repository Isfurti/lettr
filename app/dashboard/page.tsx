import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { listResumesForUser } from "@/lib/db";
import { NewResumeButton } from "@/components/NewResumeButton";
import { SignOutButton } from "@/components/SignOutButton";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const userId = (session.user as { id: string }).id;
  const resumes = await listResumesForUser(userId);

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-8 py-12">
      <div className="flex items-center justify-between mb-10">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-seal font-mono mb-1">Dashboard</p>
          <h1 className="font-display font-bold text-2xl">Your resumes</h1>
        </div>
        <div className="flex items-center gap-3">
          <NewResumeButton />
          <SignOutButton />
        </div>
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
    </main>
  );
}
