import { NextRequest, NextResponse } from "next/server";
import { createHash } from "node:crypto";
import { createClient } from "@sanity/client";
import { BILL_ID } from "@/lib/push";

/**
 * POST   { subscription, bills }  save or update this device's push subscription
 * DELETE { endpoint }             forget it (turning notifications off)
 *
 * Stored in the private Sanity dataset under "push.<hash>" (path-scoped, never
 * public). Holds only the push endpoint/keys and followed bill IDs: no name,
 * email or account.
 */
const projectId = process.env.SANITY_API_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const sanity = projectId
  ? createClient({ projectId, dataset: process.env.SANITY_API_DATASET ?? "production", apiVersion: "2025-01-01", token: process.env.SANITY_API_WRITE_TOKEN, useCdn: false })
  : null;

const docId = (endpoint: string) => `push.${createHash("sha256").update(endpoint).digest("hex").slice(0, 32)}`;
const validEndpoint = (e: unknown): e is string => typeof e === "string" && e.length < 1000 && /^https:\/\//.test(e);

export async function POST(req: NextRequest) {
  if (!sanity) return NextResponse.json({ ok: false, error: "Notifications aren’t set up" }, { status: 503 });
  const body = await req.json().catch(() => null);
  const sub = body?.subscription;
  const bills: unknown = body?.bills;
  if (!sub || !validEndpoint(sub.endpoint) || typeof sub.keys?.p256dh !== "string" || typeof sub.keys?.auth !== "string")
    return NextResponse.json({ ok: false, error: "Invalid subscription" }, { status: 400 });
  if (!Array.isArray(bills) || bills.length > 300 || !bills.every((b) => typeof b === "string" && BILL_ID.test(b)))
    return NextResponse.json({ ok: false, error: "Invalid bills" }, { status: 400 });
  await sanity.createOrReplace({
    _id: docId(sub.endpoint),
    _type: "pushSubscription",
    endpoint: sub.endpoint,
    keys: { p256dh: sub.keys.p256dh.slice(0, 200), auth: sub.keys.auth.slice(0, 100) },
    bills,
    updatedAt: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  if (!sanity) return NextResponse.json({ ok: true });
  const body = await req.json().catch(() => null);
  if (!validEndpoint(body?.endpoint)) return NextResponse.json({ ok: false }, { status: 400 });
  await sanity.delete(docId(body.endpoint)).catch(() => null);
  return NextResponse.json({ ok: true });
}
