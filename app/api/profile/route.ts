import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getProfile, listOriginalResumeTitles, saveProfileSettings } from "@/lib/db";
import { PROFILE_CONSENT_VERSION, profileUrl } from "@/lib/profile-consent";

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

function view(p: Awaited<ReturnType<typeof getProfile>>) {
  if (!p) return null;
  return {
    resumeId: p.resume_id,
    shared: p.shared,
    url: p.shared && p.slug ? profileUrl(p.slug) : null,
    showCity: p.show_city,
    showLinks: p.show_links,
    showContact: p.show_contact,
    showPersonal: p.show_personal,
    hasPhoto: p.has_photo,
    photoVersion: p.photo_etag,
    // What the owner may need to know, never the internal reason text.
    takenDown: Boolean(p.disabled_at),
    consentVersion: p.consent_version,
  };
}

/** The owner's profile settings and the resumes they can choose from. Free for everyone. */
export async function GET() {
  const userId = await userIdOf();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [profile, resumes] = await Promise.all([getProfile(userId), listOriginalResumeTitles(userId)]);
  return NextResponse.json({ profile: view(profile), resumes, consentVersion: PROFILE_CONSENT_VERSION });
}

/** Chooses the resume and what is shown. This never makes anything public by itself: sharing has its own step. */
export async function PUT(req: Request) {
  const userId = await userIdOf();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = Settings.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  const saved = await saveProfileSettings(userId, parsed.data);
  if (!saved) return NextResponse.json({ error: "Choose one of your own resumes (not a tailored version)." }, { status: 400 });
  return NextResponse.json({ profile: view(saved) });
}
