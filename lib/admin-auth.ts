import { redirect, notFound } from "next/navigation";
import { auth } from "./auth";

/** Redirects to login if not authenticated, 404s if not the admin. Returns the session otherwise. */
export async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const yourEmail = session.user.email?.trim().toLowerCase();
  if (!adminEmail || yourEmail !== adminEmail) notFound();

  return session;
}

/**
 * API-route version - redirect()/notFound() only work in page components,
 * so route handlers use this instead and return their own 401/403 JSON.
 * Returns the admin's user id/email if authorized, null otherwise.
 */
export async function requireAdminApi(): Promise<{ id: string; email: string } | null> {
  const session = await auth();
  if (!session?.user?.email) return null;

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const yourEmail = session.user.email.trim().toLowerCase();
  if (!adminEmail || yourEmail !== adminEmail) return null;

  return { id: (session.user as { id: string }).id, email: session.user.email };
}
