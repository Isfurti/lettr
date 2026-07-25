import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";
import type { Provider } from "next-auth/providers";
import bcrypt from "bcryptjs";
import { getUserByEmail } from "./db";
import { findOrCreateOAuthUser } from "./oauth-user";

const providers: Provider[] = [
  Credentials({
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    authorize: async (credentials) => {
      const email = credentials?.email as string | undefined;
      const password = credentials?.password as string | undefined;
      if (!email || !password) return null;

      const user = await getUserByEmail(email.toLowerCase());
      if (!user) return null;

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return null;

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
