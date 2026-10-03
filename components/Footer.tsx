import Link from "next/link";

/** The one site footer - used on every public page so links and labels never drift apart. */
export function Footer() {
  return (
    <footer className="border-t border-rule py-10 bg-paper">
      <div className="max-w-6xl mx-auto w-full px-4 sm:px-8 grid grid-cols-2 sm:grid-cols-4 gap-8">
        <div className="col-span-2 sm:col-span-1">
          <span className="font-display font-semibold text-lg">Lettr</span>
          <p className="text-xs text-ink-soft mt-2">© {new Date().getFullYear()} Lettr. All rights reserved.</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Product</p>
          <div className="space-y-2 text-sm">
            <Link href="/builder/new" className="block hover:text-seal">Resume builder</Link>
            <Link href="/templates" className="block hover:text-seal">Templates</Link>
            <Link href="/pricing" className="block hover:text-seal">Pricing</Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Help</p>
          <div className="space-y-2 text-sm">
            <Link href="/support" className="block hover:text-seal">Support</Link>
            <Link href="/privacy" className="block hover:text-seal">Privacy Policy</Link>
            <Link href="/terms" className="block hover:text-seal">Terms of Service</Link>
          </div>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-ink-soft mb-3">Account</p>
          <div className="space-y-2 text-sm">
            <Link href="/login" className="block hover:text-seal">Sign in</Link>
            <Link href="/signup" className="block hover:text-seal">Create account</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
