import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { CONTENT_TAG } from "@/lib/sanity";

/**
 * POST /api/revalidate
 *
 * Called by a Sanity webhook on publish so CMS edits go live in seconds.
 * The webhook must send header `x-revalidate-secret: <SANITY_REVALIDATE_SECRET>`.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SANITY_REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  // Webhook (not a Server Action): expire now so the next request reads fresh content.
  revalidateTag(CONTENT_TAG, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: CONTENT_TAG, at: new Date().toISOString() });
}
