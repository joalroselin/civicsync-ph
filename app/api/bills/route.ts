import { NextRequest, NextResponse } from "next/server";
import { searchPeople, getPersonBills } from "@/lib/openCongress";

/**
 * GET /api/bills?politician=<name>&congress=<n>&offset=<n>
 *
 * Powers the Receipts feature: find a politician, list their authored
 * bills. Runs entirely on Open Congress — no BatasWatch dependency,
 * so this endpoint works even if the status source is down.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const politician = searchParams.get("politician");
  const congress = searchParams.get("congress");
  const offset = searchParams.get("offset");

  if (!politician) {
    return NextResponse.json({ error: "politician query param is required" }, { status: 400 });
  }

  try {
    const people = await searchPeople({ q: politician, limit: 1 });
    if (people.length === 0) {
      return NextResponse.json({ person: null, bills: [], total: 0 });
    }

    const person = people[0];
    const page = await getPersonBills(person.id, {
      congress: congress ? Number(congress) : undefined,
      offset: offset ? Number(offset) : undefined,
      limit: 20,
    });

    return NextResponse.json({ person, bills: page.data, total: page.total, hasMore: page.hasMore });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Upstream lookup failed" }, { status: 502 });
  }
}
