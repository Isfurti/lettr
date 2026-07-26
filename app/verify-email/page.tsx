import Link from "next/link";
import { verifyEmailByToken } from "@/lib/db";
import { PublicNav } from "@/components/PublicNav";
import { Footer } from "@/components/Footer";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const user = token ? await verifyEmailByToken(token) : undefined;

  return (
    <>
      <PublicNav />
      <main className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="paper-sheet rounded-sm p-10 max-w-sm text-center">
          {user ? (
            <>
              <p className="text-3xl mb-3">✓</p>
              <h1 className="font-display font-semibold text-xl mb-2">Email verified</h1>
              <p className="text-sm text-ink-soft mb-6">You&apos;re all set, {user.name || user.email}.</p>
              <Link href="/dashboard" className="inline-block bg-ink text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:opacity-90">
                Go to dashboard
              </Link>
            </>
          ) : (
            <>
              <h1 className="font-display font-semibold text-xl mb-2">Link expired or invalid</h1>
              <p className="text-sm text-ink-soft mb-6">
                This verification link has expired or was already used. You can request a new one from your dashboard.
              </p>
              <Link href="/login" className="inline-block bg-ink text-white px-5 py-2.5 rounded-sm text-sm font-medium hover:opacity-90">
                Log in
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
