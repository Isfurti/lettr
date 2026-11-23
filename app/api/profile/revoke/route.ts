import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { revokeProfile } from "@/lib/db";
import { isSameOriginRequest } from "@/lib/same-origin";

export const runtime = "nodejs";

/** Stops sharing and drops the link for good; sharing again makes a new one. Never blocked, never rate limited. */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isSameOriginRequest(req)) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  await revokeProfile((session.user as { id: string }).id);
  return NextResponse.json({ ok: true });
}
