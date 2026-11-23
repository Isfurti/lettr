import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getProfile, getResume, shareProfile } from "@/lib/db";
import { PROFILE_CONSENT_VERSION, PROFILE_MIN_AGE, profileUrl } from "@/lib/profile-consent";
import { checkAndRecordRateLimit, refundRateLimit } from "@/lib/rate-limit";
import { isJsonRequest, isSameOriginRequest } from "@/lib/same-origin";
import { parseStoredResume } from "@/lib/resume-version";

export const runtime = "nodejs";

const Body = z.object({
  /** "I am 16 or older (PROFILE_MIN_AGE) and I understand what becomes public." */
  ageConfirmed: z.literal(true),
  consentVersion: z.literal(PROFILE_CONSENT_VERSION),
});

/** Turns sharing on. Needs the owner's tick; a first share makes a new random link, sharing again keeps it. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  if (!isSameOriginRequest(req) || !isJsonRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: `Confirm that you are ${PROFILE_MIN_AGE} or older and understand what becomes public.` }, { status: 400 });
  }

  // Each new link is a new address to report, block or scrape, so cap how often someone can mint one.
  // Attempts that fail below are refunded, so only real changes count.
  const rate = await checkAndRecordRateLimit(userId, "profile-share", 6, 60);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many changes. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const refuse = async (error: string, status: number) => {
    await refundRateLimit(userId, "profile-share");
    return NextResponse.json({ error }, { status });
  };
  const takenDown = () => refuse("This profile was turned off by Lettr. Contact support to ask why.", 403);

  const profile = await getProfile(userId);
  if (!profile?.resume_id) return refuse("Choose a resume for your profile first.", 400);
  if (profile.disabled_at) return takenDown();

  const resume = await getResume(profile.resume_id, userId);
  const name = resume ? parseStoredResume(resume.data).contact?.fullName?.trim() : "";
  if (!name) return refuse("Add your name to that resume before sharing it.", 400);

  const shared = await shareProfile(userId, parsed.data.consentVersion, profile.resume_id);
  if (!shared?.slug) {
    // Lost a race: taken down, or the resume was switched or deleted a moment ago.
    const now = await getProfile(userId);
    if (now?.disabled_at) return takenDown();
    return refuse("Your profile changed while sharing. Check it and try again.", 409);
  }
  if (profile.shared && profile.slug === shared.slug) await refundRateLimit(userId, "profile-share"); // same link: nothing new was made
  return NextResponse.json({ url: profileUrl(shared.slug) });
}
