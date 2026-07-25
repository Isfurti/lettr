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
