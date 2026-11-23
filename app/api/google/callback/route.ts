import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectGoogleDriveForUser } from "@/lib/google-drive";
import { DRIVE_STATE_COOKIE, oauthStateMatches } from "@/lib/oauth-state";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/login", req.url));

  const userId = (session.user as { id: string }).id;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard/resumes?drive_error=${encodeURIComponent(error)}`, req.url));
  }

  // `state` must be the random value this browser got when it started the
  // connection (cookie set by /api/google/connect), not anything a link can carry.
  const cookieState = req.headers.get("cookie")?.match(new RegExp(`(?:^|; )${DRIVE_STATE_COOKIE}=([^;]+)`))?.[1];
  const invalid = () => {
    const res = NextResponse.redirect(new URL("/dashboard/resumes?drive_error=invalid_callback", req.url));
    res.cookies.delete({ name: DRIVE_STATE_COOKIE, path: "/api/google" });
    return res;
  };
  if (!code || !oauthStateMatches(cookieState, state)) return invalid();

  try {
    await connectGoogleDriveForUser(userId, code);
  } catch {
    const failed = NextResponse.redirect(new URL("/dashboard/resumes?drive_error=token_exchange_failed", req.url));
    failed.cookies.delete({ name: DRIVE_STATE_COOKIE, path: "/api/google" });
    return failed;
  }

  const done = NextResponse.redirect(new URL("/dashboard/resumes?drive_connected=true", req.url));
  done.cookies.delete({ name: DRIVE_STATE_COOKIE, path: "/api/google" });
  return done;
}
