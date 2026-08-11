import bcrypt from "bcryptjs";
import { randomUUID, randomBytes } from "node:crypto";
import { getUserByEmail, createUser, markEmailVerified, type UserRow } from "./db";

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
  if (existing) {
    // Self-healing: a successful OAuth sign-in happening right now is
    // proof of email ownership, regardless of when this account was
    // originally created. This catches accounts that got stuck unverified
    // before the emailVerified:true fix below existed - automatically, on
    // every login, for every affected user, with no admin action needed.
    // (Previously this required an admin to manually click "Mark email
    // verified" per affected user - a reactive patch, not a real fix.)
    if (!existing.email_verified) {
      await markEmailVerified(existing.id);
      return { ...existing, email_verified: true };
    }
    return existing;
  }

  const id = randomUUID();
  const unusablePasswordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 12);
  // emailVerified: true - signing in via Google/LinkedIn OAuth IS the
  // verification. There's no separate "verify your email" step needed
  // (or even possible) for an account that only ever exists because an
  // OAuth provider already confirmed this person owns this email address.
  // Defaulting this to false (the createUser default, meant for password
  // signups) left OAuth users permanently stuck seeing an unverifiable
  // "please verify your email" banner - a real bug, not a style choice.
  await createUser({ id, email: normalizedEmail, passwordHash: unusablePasswordHash, name: name ?? undefined, emailVerified: true });

  const created = await getUserByEmail(normalizedEmail);
  if (!created) throw new Error("Failed to create OAuth user");
  return created;
}
