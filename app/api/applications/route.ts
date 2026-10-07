import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { countApplications, createApplication, getUserById, listApplications } from "@/lib/db";
import { canTrackJob, limitTier } from "@/lib/limits";
import { ApplicationSchema, MAX_APPLICATIONS } from "@/lib/applications";
import { checkAndRecordRateLimit } from "@/lib/rate-limit";

async function userId() {
  const session = await auth();
  return (session?.user as { id?: string } | undefined)?.id ?? null;
}

export async function GET() {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ applications: await listApplications(id) });
}

export async function POST(req: Request) {
  const id = await userId();
  if (!id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const limit = await checkAndRecordRateLimit(id, "applications-create", 60, 10);
  if (!limit.allowed) return NextResponse.json({ error: "Too many changes. Try again in a minute." }, { status: 429 });
  const tracked = await countApplications(id);
  if (tracked >= MAX_APPLICATIONS) {
    return NextResponse.json({ error: `You can track up to ${MAX_APPLICATIONS} applications. Delete some old ones first.` }, { status: 400 });
  }
  const planCheck = canTrackJob(limitTier(await getUserById(id)), tracked);
  if (!planCheck.allowed) return NextResponse.json({ error: planCheck.reason, upgradeRequired: true }, { status: 402 });
  const parsed = ApplicationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }
  return NextResponse.json({ application: await createApplication(id, parsed.data) }, { status: 201 });
}
