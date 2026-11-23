import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getProfile, listOriginalResumeTitles, saveProfileSettings } from "@/lib/db";
import { PROFILE_CONSENT_VERSION } from "@/lib/profile-consent";
import { isSameOriginRequest } from "@/lib/same-origin";
import { profileView } from "@/lib/profile-view";

export const runtime = "nodejs";

const Settings = z.object({
  resumeId: z.string().min(1).max(100),
  showCity: z.boolean(),
  showLinks: z.boolean(),
  showContact: z.boolean(),
  showPersonal: z.boolean(),
});

async function userIdOf(): Promise<string | null> {
  const session = await auth();
  return session?.user ? (session.user as { id: string }).id : null;
}

/** The owner's profile settings and the resumes they can choose from. Free for everyone. */
export async function GET() {
  const userId = await userIdOf();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [profile, resumes] = await Promise.all([getProfile(userId), listOriginalResumeTitles(userId)]);
  return NextResponse.json({ profile: profileView(profile), resumes, consentVersion: PROFILE_CONSENT_VERSION });
}

/**
 * Chooses the resume and what is shown. It never starts sharing (that has its own
 * step with the age tick), and a different resume always stops it. While a profile
 * is shared, the "what people can see" switches act on the live page at once; the
 * settings screen says so when it is on.
 */
export async function PUT(req: Request) {
  const userId = await userIdOf();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = Settings.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const saved = await saveProfileSettings(userId, parsed.data);
  if (!saved) return NextResponse.json({ error: "Choose one of your own resumes (not a tailored version)." }, { status: 400 });
  return NextResponse.json({ profile: profileView(saved) });
}
