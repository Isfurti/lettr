import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveProfileLook } from "@/lib/db";
import { ProfileLook } from "@/lib/profile-look";
import { isSameOriginRequest } from "@/lib/same-origin";
import { profileView } from "@/lib/profile-view";

export const runtime = "nodejs";

/** Banner, pronouns, open to work and the last-updated switch. Needs a profile (a resume chosen) first. */
export async function PUT(req: Request) {
  const session = await auth();
  const userId = session?.user ? (session.user as { id: string }).id : null;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = ProfileLook.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the text you entered. Keep it short, with no < or > characters." }, { status: 400 });
  const saved = await saveProfileLook(userId, parsed.data);
  if (!saved) return NextResponse.json({ error: "Choose a resume for your profile first." }, { status: 400 });
  return NextResponse.json({ profile: profileView(saved) });
}
