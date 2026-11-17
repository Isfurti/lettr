import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { buildGoogleAuthUrl } from "@/lib/google-drive";
import { DRIVE_STATE_COOKIE, DRIVE_STATE_MAX_AGE, newOAuthState } from "@/lib/oauth-state";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // A random value per attempt, kept in a cookie of this browser, so a
    // callback link crafted by someone else cannot connect their Drive here.
    const state = newOAuthState();
    const res = NextResponse.redirect(buildGoogleAuthUrl(state));
    res.cookies.set(DRIVE_STATE_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/google",
      maxAge: DRIVE_STATE_MAX_AGE,
    });
    return res;
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Couldn't start the Google connection. Please try again." }, { status: 500 });
  }
}
