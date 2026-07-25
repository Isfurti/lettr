import Link from "next/link";

export function PublicNav() {
  return (
    <header className="border-b border-rule bg-paper">
      <div className="max-w-6xl mx-auto w-full px-8 py-5 flex items-center justify-between">
        <Link href="/" className="font-display font-semibold text-xl hover:opacity-80 transition-opacity">
          Lettr
        </Link>
        <nav className="hidden sm:flex items-center gap-8 text-sm text-ink-soft">
          <Link href="/#features" className="hover:text-ink">Features</Link>
          <Link href="/templates" className="hover:text-ink">Templates</Link>
          <Link href="/pricing" className="hover:text-ink">Pricing</Link>
        </nav>
        <div className="flex items-center gap-5">
          <Link href="/login" className="text-sm text-ink-soft hover:text-ink">Sign in</Link>
          <Link
            href="/signup"
            className="bg-ink text-white px-4 py-2 rounded-sm text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Build Resume
          </Link>
        </div>
      </div>
    </header>
  );
}
