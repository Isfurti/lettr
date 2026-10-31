/**
 * Where to send someone after they sign in or sign up, from the ?continue=
 * value on the login and signup pages. Only these fixed places, so the
 * parameter can't be used to send people to another site.
 */
export function afterSignIn(next: string | null | undefined): string {
  if (next === "import") return "/dashboard?import=1";
  if (next === "pricing") return "/pricing";
  // Google/LinkedIn sign-in can't run code on the way back, so the dashboard
  // saves the guest's resume (e.g. from the free checker) when it sees this.
  if (next === "builder" || next === "export") return "/dashboard?draft=save";
  return "/dashboard";
}
