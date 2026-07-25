import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-rule px-8 py-10 bg-paper">
      <div className="max-w-6xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-6">
          <span className="font-display font-semibold text-lg">Lettr</span>
          <p className="text-xs text-ink-soft">© 2026 Lettr. All rights reserved.</p>
        </div>
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-ink-soft">
          <Link href="/pricing" className="hover:text-seal transition-colors">Pricing</Link>
          <Link href="/templates" className="hover:text-seal transition-colors">Templates</Link>
          <Link href="/support" className="hover:text-seal transition-colors">Contact</Link>
          <Link href="/privacy" className="hover:text-seal transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-seal transition-colors">Terms of Service</Link>
        </nav>
      </div>
    </footer>
  );
}
