import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { getUserByEmail, getAuthEpoch } from "./db";
import { findOrCreateOAuthUser } from "./oauth-user";
import { takeSignupSource } from "./signup-source-cookie";
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

      return { id: user.id, email: user.email, name: user.name ?? undefined, epoch: Number(user.auth_epoch ?? 0) } as { id: string; email: string; name?: string };
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
          const dbUser = await findOrCreateOAuthUser(user.email, user.name, await takeSignupSource());
          token.id = dbUser.id;
          token.epoch = Number(dbUser.auth_epoch ?? 0);
        }
      } else if (user) {
        token.id = user.id;
        token.epoch = Number((user as { epoch?: number }).epoch ?? 0);
      } else if (typeof token.id === "string") {
        // The account was deleted, or its password was reset / it was claimed
        // by an OAuth sign-in, while this browser was still signed in: end the
        // session. Sessions made before the counter existed count as 0. If
        // the database can't be reached, keep the session: a short outage
        // shouldn't sign everyone out.
        try {
          const epoch = await getAuthEpoch(token.id);
          if (epoch === null || epoch !== Number(token.epoch ?? 0)) return null;
        } catch {
          // keep the session
        }
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
