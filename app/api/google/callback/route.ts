import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectGoogleDriveForUser } from "@/lib/google-drive";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.redirect(new URL("/login", req.url));

  const userId = (session.user as { id: string }).id;
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL(`/dashboard?drive_error=${encodeURIComponent(error)}`, req.url));
  }

  // The state param carries the userId that started the flow - reject if it
  // doesn't match the currently logged-in session, to stop a crafted
  // callback URL from attaching Drive tokens to the wrong account.
  if (!code || state !== userId) {
    return NextResponse.redirect(new URL("/dashboard?drive_error=invalid_callback", req.url));
  }

  try {
    await connectGoogleDriveForUser(userId, code);
  } catch {
    return NextResponse.redirect(new URL("/dashboard?drive_error=token_exchange_failed", req.url));
  }

  return NextResponse.redirect(new URL("/dashboard?drive_connected=true", req.url));
}
