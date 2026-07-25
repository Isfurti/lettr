import bcrypt from "bcryptjs";
import { randomUUID, randomBytes } from "node:crypto";
import { getUserByEmail, createUser, type UserRow } from "./db";

/**
 * Called on every OAuth (Google/LinkedIn) sign-in. Our app's own `users`
 * table is the source of truth for everything (resumes, billing, support
 * tickets all reference users.id) - we don't use a NextAuth database
 * adapter, so OAuth providers don't automatically create a row here.
 *
 * If a user already exists with this email (e.g. they originally signed up
 * with a password), we sign them into that same account rather than create
 * a duplicate - this is standard "account linking by verified email"
 * behavior. If not, we create a new account with a random, never-used
 * password hash (they can never log in with a password unless they
 * separately set one - only OAuth will work for that account).
 */
export async function findOrCreateOAuthUser(email: string, name?: string | null): Promise<UserRow> {
  const normalizedEmail = email.toLowerCase();
  const existing = await getUserByEmail(normalizedEmail);
  if (existing) return existing;

  const id = randomUUID();
  const unusablePasswordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
  await createUser({ id, email: normalizedEmail, passwordHash: unusablePasswordHash, name: name ?? undefined });

  const created = await getUserByEmail(normalizedEmail);
  if (!created) throw new Error("Failed to create OAuth user");
  return created;
}
