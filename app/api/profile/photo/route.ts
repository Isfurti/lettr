import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/lib/auth";
import { clearProfilePhoto, ensureProfile, getOwnProfilePhoto, setProfilePhoto } from "@/lib/db";
import { MAX_PHOTO_BYTES, sanitizeProfilePhoto } from "@/lib/profile-photo";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

async function userIdOf(): Promise<string | null> {
  const session = await auth();
  return session?.user ? (session.user as { id: string }).id : null;
}

/** The owner's own picture, for the settings page. Never cached by anyone else. */
export async function GET() {
  const userId = await userIdOf();
  if (!userId) return new NextResponse(null, { status: 401 });
  const p = await getOwnProfilePhoto(userId);
  if (!p) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(p.photo), {
    headers: { "Content-Type": p.mime, "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" },
  });
}

/** Saves a new picture. Free for everyone. The browser sends an already-resized JPEG; the server still checks and cleans it. */
export async function POST(req: Request) {
  const userId = await userIdOf();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rate = await checkAndRecordRateLimit(userId, "profile-photo", 10, 60);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many uploads. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  if (Number(req.headers.get("content-length") ?? 0) > MAX_PHOTO_BYTES * 3) {
    return NextResponse.json({ error: "That picture is too large." }, { status: 400 });
  }
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!file || !(file instanceof File)) return NextResponse.json({ error: "No picture uploaded." }, { status: 400 });

  try {
    const result = sanitizeProfilePhoto(Buffer.from(await file.arrayBuffer()));
    if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
    await ensureProfile(userId);
    const saved = await setProfilePhoto(userId, result.buffer, result.mime, result.etag);
    if (!saved) return NextResponse.json({ error: "Couldn't save the picture." }, { status: 500 });
    return NextResponse.json({ ok: true, version: result.etag });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: "Couldn't save the picture." }, { status: 500 });
  }
}

/** Removes the picture; the page falls back to the initials avatar. */
export async function DELETE() {
  const userId = await userIdOf();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await clearProfilePhoto(userId);
  return NextResponse.json({ ok: true });
}
