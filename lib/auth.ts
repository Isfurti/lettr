import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "./db";
import { findOrCreateOAuthUser } from "./oauth-user";
import { isRateLimited, recordRateLimitHit } from "./rate-limit";

/** Shown on the sign-in page instead of "wrong password" when an account is being guessed at. */
class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}

// Brute-force protection: after this many wrong passwords for one email in
// the window, sign-in for that email pauses until the window passes.
const MAX_FAILED_LOGINS = 10;
const FAILED_LOGIN_WINDOW_MINUTES = 15;

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = (credentials?.email as string | undefined)?.trim().toLowerCase();
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const key = `login:${email}`;
      if (await isRateLimited(key, "login-failed", MAX_FAILED_LOGINS, FAILED_LOGIN_WINDOW_MINUTES)) {
        throw new TooManyAttempts();
      }

      const user = await getUserByEmail(email);
      // Accounts made with Google/LinkedIn may have no password at all.
      const valid = Boolean(user?.password_hash) && (await bcrypt.compare(password, user!.password_hash).catch(() => false));
      if (!user || !valid) {
        await recordRateLimitHit(key, "login-failed");
        return null;
      }

      return { id: user.id, email: user.email, name: user.name ?? undefined };
    },
  }),
];

// Only register OAuth providers when their credentials are actually
// configured - otherwise NextAuth throws at startup. This lets the app run
// fine (credentials login only) before Google/LinkedIn apps are set up.
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  );
}

if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  providers.push(
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers,
  callbacks: {
    jwt: async ({ token, user, account }) => {
      if (user && account && account.provider !== "credentials") {
        // OAuth sign-in: find-or-create our own user row keyed by email,
        // so resumes/billing/support all have a stable user id to attach to.
        if (user.email) {
          const dbUser = await findOrCreateOAuthUser(user.email, user.name);
          token.id = dbUser.id;
        }
      } else if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) (session.user as { id?: string }).id = token.id as string;
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});
