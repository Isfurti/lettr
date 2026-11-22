import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { createResumeVersion, getResume, getUserById, listVersionNames, logActivity } from "@/lib/db";
import { usageContext } from "@/lib/free-usage";
import * as Sentry from "@sentry/nextjs";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";
import { publicMessage } from "@/lib/public-error";
import { isNewerThanSupported } from "@/lib/resume-version";
import { checkTailoredVersion, looksLikeResume, uniqueVersionName } from "@/lib/tailor";
import { parseStoredResume } from "@/lib/resume-version";

const MAX_VERSIONS_PER_RESUME = 20;

const Schema = z.object({ name: z.string().min(1).max(60), data: z.unknown() });

/**
 * Saves a tailored version of a resume as its own row. Pro only. The original
 * row is only read: the version is a copy that carries the accepted changes.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId = (session.user as { id: string }).id;
  const { id: parentId } = await params;

  const raw = await req.text();
  if (raw.length > 1_000_000) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  let body: unknown = null;
  try {
    body = JSON.parse(raw);
  } catch {}
  const parsed = Schema.safeParse(body);
  if (!parsed.success || typeof parsed.data.data !== "object" || parsed.data.data === null) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }
  if (isNewerThanSupported(parsed.data.data)) return NextResponse.json({ error: "Unsupported resume version." }, { status: 400 });

  const user = await getUserById(userId);
  const ctx = await usageContext(user ?? { id: userId, email: session.user.email });
  if (ctx.tier !== "pro") {
    return NextResponse.json({ error: "Saving a tailored version is a Pro feature.", upgradeRequired: true }, { status: 402 });
  }

  const rate = await checkAndRecordRateLimit(userId, "resume-version", 20, 10);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many requests. Try again in ${rate.retryAfterSeconds}s.` },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  try {
    const existing = await listVersionNames(parentId, userId);
    if (existing.length >= MAX_VERSIONS_PER_RESUME) {
      return NextResponse.json({ error: `You can keep up to ${MAX_VERSIONS_PER_RESUME} versions of one resume. Delete one first.` }, { status: 400 });
    }
    // The original is read from the database, not trusted from the request: the version may differ from it only in what tailoring may change.
    const parent = await getResume(parentId, userId);
    if (!parent || parent.parent_id) return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    const proposed = parsed.data.data;
    const original = parseStoredResume(parent.data);
    if (!looksLikeResume(proposed) || !looksLikeResume(original)) return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    const problem = checkTailoredVersion(original, proposed);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    const name = uniqueVersionName(parsed.data.name, existing);
    const created = await createResumeVersion({
      id: randomUUID(),
      userId,
      parentId,
      versionName: name,
      data: JSON.stringify(proposed),
    });
    if (!created) return NextResponse.json({ error: "Resume not found" }, { status: 404 });

    await logActivity(userId, "resume_version_created", name);
    return NextResponse.json({ id: created.id, title: created.title, versionName: name }, { status: 201 });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json({ error: publicMessage(err, "Couldn't save the version") }, { status: 500 });
  }
}
