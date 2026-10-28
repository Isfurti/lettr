import { NextResponse } from "next/server";
import { getCountryFromHeaders } from "@/lib/pricing-region";
import { consentRequired } from "@/lib/consent-region";

/** Whether this visitor has to opt in to ad and analytics cookies (see lib/consent-region.ts). */
export async function GET(req: Request) {
  return NextResponse.json(
    { required: consentRequired(getCountryFromHeaders(req.headers)) },
    // Different answer per country, so never cache it in a shared cache.
    { headers: { "Cache-Control": "private, no-store" } }
  );
}
