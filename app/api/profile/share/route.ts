import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getProfile, getResume, shareProfile } from "@/lib/db";
import { PROFILE_CONSENT_VERSION, profileUrl } from "@/lib/profile-consent";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { parseStoredResume } from "@/lib/resume-version";

export const runtime = "nodejs";

const Body = z.object({
  /** "I am 16 or older and I understand what becomes public." */
  ageConfirmed: z.literal(true),
  consentVersion: z.literal(PROFILE_CONSENT_VERSION),
});

/** Turns sharing on. Needs the owner's tick; a first share makes a new random link, sharing again keeps it. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Confirm that you are 16 or older and understand what becomes public." }, { status: 400 });
  }

  // New links are the thing to limit (someone cycling links to dodge a takedown), so cap how often one is made.
  const rate = await checkAndRecordRateLimit(userId, "profile-share", 6, 60);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many changes. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const profile = await getProfile(userId);
  if (!profile?.resume_id) return NextResponse.json({ error: "Choose a resume for your profile first." }, { status: 400 });
  if (profile.disabled_at) {
    return NextResponse.json({ error: "This profile was turned off by Lettr. Contact support to ask why." }, { status: 403 });
  }

  const resume = await getResume(profile.resume_id, userId);
  const name = resume ? parseStoredResume(resume.data).contact?.fullName?.trim() : "";
  if (!name) return NextResponse.json({ error: "Add your name to that resume before sharing it." }, { status: 400 });

  const shared = await shareProfile(userId, parsed.data.consentVersion);
  if (!shared?.slug) return NextResponse.json({ error: "Couldn't turn sharing on." }, { status: 400 });
  return NextResponse.json({ url: profileUrl(shared.slug) });
}
