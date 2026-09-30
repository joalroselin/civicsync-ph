import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createClient } from "@sanity/client";
import { isIntakeKind, validateIntake } from "@/lib/intake";

/**
 * POST /api/intake: stores a Get involved form submission in the private
 * Sanity dataset, where it appears in the Studio Inbox.
 *
 * Privacy: submissions use IDs under the "inbox." path. Sanity never serves
 * path-scoped documents to unauthenticated requests, even when the dataset is
 * public, so names and emails stay private either way.
 *
 * Spam protection: a hidden honeypot field, a minimum time-to-submit, size
 * limits, and a per-instance rate limit.
 */
const writeClient = createClient({
  projectId: process.env.SANITY_API_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.SANITY_API_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
});

const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const recent = new Map<string, number[]>();

function rateLimited(ip: string) {
  const now = Date.now();
  const hits = (recent.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  recent.set(ip, hits);
  return hits.length > MAX_PER_WINDOW;
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }
  if (JSON.stringify(body).length > 10_000) {
    return NextResponse.json({ ok: false, error: "Too long" }, { status: 413 });
  }

  // Honeypot filled, or submitted implausibly fast: pretend success, store nothing.
  const startedAt = Number(body.startedAt);
  if (body.website || !Number.isFinite(startedAt) || Date.now() - startedAt < 2500) {
    return NextResponse.json({ ok: true });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many submissions. Please try again later." }, { status: 429 });
  }

  const kind = body.kind;
  if (!isIntakeKind(kind)) return NextResponse.json({ ok: false, error: "Unknown form" }, { status: 400 });

  const { ok, values, errors } = validateIntake(kind, body);
  if (!ok) return NextResponse.json({ ok: false, errors }, { status: 422 });

  if (!process.env.SANITY_API_WRITE_TOKEN) {
    console.error("Intake: SANITY_API_WRITE_TOKEN missing");
    return NextResponse.json({ ok: false, error: "Form is temporarily unavailable" }, { status: 503 });
  }

  try {
    await writeClient.create({
      _id: `inbox.${randomUUID()}`,
      _type: "intakeSubmission",
      kind,
      status: "new",
      submittedAt: new Date().toISOString(),
      ...values,
    });
  } catch (err) {
    console.error("Intake: Sanity write failed", err);
    return NextResponse.json({ ok: false, error: "Couldn’t send right now. Please try again, or email us." }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
