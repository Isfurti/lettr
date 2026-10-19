import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { requireAdminApi } from "@/lib/admin-auth";

/** Admin "Send test error": checks that error alerts reach Sentry. */
export async function POST() {
  const admin = await requireAdminApi();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!process.env.SENTRY_DSN) return NextResponse.json({ error: "Sentry isn't set up (SENTRY_DSN is missing)." }, { status: 503 });

  const id = Sentry.captureException(new Error("Lettr test error (sent from Admin → System). Safe to ignore."));
  const sent = await Sentry.flush(5000);
  return NextResponse.json({ ok: sent, id });
}
