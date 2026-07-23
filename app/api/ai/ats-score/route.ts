import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { scoreResumeAgainstJob } from "@/lib/ats-score";

const Schema = z.object({
  resume: z.any(),
  jobDescription: z.string().min(10).max(10000),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input", details: parsed.error.flatten() }, { status: 400 });
  }

  const result = scoreResumeAgainstJob(parsed.data.resume, parsed.data.jobDescription);
  return NextResponse.json(result);
}
