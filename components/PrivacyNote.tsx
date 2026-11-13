/** The short privacy promise shown on the home page, pricing page and builder. */
export const PRIVACY_NOTE =
  "Your resume is yours. We never sell your data. Photos are cleaned in your browser before upload (location and camera details removed). Delete your account and everything in it any time from your dashboard.";

export function PrivacyNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-slate leading-relaxed ${className}`}>
      <span aria-hidden="true">🔒 </span>
      {PRIVACY_NOTE}
    </p>
  );
}
