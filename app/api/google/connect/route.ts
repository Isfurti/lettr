import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildGoogleAuthUrl } from "@/lib/google-drive";

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userId = (session.user as { id: string }).id;

  try {
    const url = buildGoogleAuthUrl(userId);
    return NextResponse.redirect(url);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start Google connection";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
