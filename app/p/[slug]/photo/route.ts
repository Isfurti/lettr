import { getPublicProfilePhoto } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * The picture of a shared profile. Only a live link answers: after the owner
 * stops sharing, or an admin takes the page down, this is a plain 404. The
 * answer is cached briefly so a revoked link stops showing the picture soon.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = await getPublicProfilePhoto(slug);
  if (!p) return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });

  const etag = `"${p.etag}"`;
  const headers = {
    "Content-Type": p.mime,
    ETag: etag,
    "Cache-Control": "public, max-age=60, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "X-Robots-Tag": "noindex, nofollow",
    "Referrer-Policy": "no-referrer",
  };
  if (req.headers.get("if-none-match") === etag) return new Response(null, { status: 304, headers });
  return new Response(new Uint8Array(p.photo), { headers });
}
