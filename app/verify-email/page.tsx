import Link from "next/link";
import { verifyEmailByToken } from "@/lib/db";
import { CardPage } from "@/components/AuthShell";

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const user = token ? await verifyEmailByToken(token) : undefined;

  return (
    <CardPage>
      <div className="text-center">
        {user ? (
          <>
            <p className="mx-auto mb-4 w-14 h-14 rounded-full bg-gold text-ink text-2xl font-extrabold flex items-center justify-center shadow-[0_4px_0_var(--gold-deep)]">
              ✓
            </p>
            <h1 className="font-brand font-extrabold text-3xl tracking-tight mb-2">Email verified</h1>
            <p className="text-slate mb-6">You&apos;re all set, {user.name || user.email}.</p>
            <Link
              href="/dashboard"
              className="btn-press inline-flex items-center justify-center w-full min-h-12 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
            >
              Go to dashboard
            </Link>
          </>
        ) : (
          <>
            <h1 className="font-brand font-extrabold text-3xl tracking-tight mb-2">Link expired or invalid</h1>
            <p className="text-slate mb-6">
              This verification link has expired or was already used. You can request a new one from your dashboard.
            </p>
            <Link
              href="/login"
              className="btn-press inline-flex items-center justify-center w-full min-h-12 rounded-full bg-brand-blue text-white font-bold shadow-[0_5px_0_var(--brand-blue-deep)] disabled:opacity-60"
            >
              Log in
            </Link>
          </>
        )}
      </div>
    </CardPage>
  );
}
