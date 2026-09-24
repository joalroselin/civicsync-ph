import { NextRequest, NextResponse } from "next/server";
import { getBillDetail } from "@/lib/bills";

/**
 * GET /api/bills/:id
 *
 * Bill detail merged from Open Congress (authorship) and BatasWatch
 * (status, best-effort). See lib/bills.ts.
 */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    return NextResponse.json(await getBillDetail(params.id));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Bill not found" }, { status: 404 });
  }
}
