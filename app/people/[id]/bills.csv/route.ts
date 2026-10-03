import { getPerson, personName } from "@/lib/openCongress";
import { BATASWATCH_CONGRESS } from "@/lib/batasWatch";
import { allPersonBills } from "@/lib/people";
import { authorRole } from "@/lib/bills";
import { toTitleCase } from "@/lib/format";
import { SITE_URL } from "@/lib/site";

/** A lawmaker's authored bills as CSV, for researchers and journalists. ?congress=20 | 19 | … | all */
export async function GET(req: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const person = await getPerson(params.id).catch(() => null);
  if (!person) return new Response("Lawmaker not found", { status: 404 });

  const filter = new URL(req.url).searchParams.get("congress") ?? "all";
  const congress = filter === "all" ? undefined : Number(filter) || undefined;
  const bills = await allPersonBills(person, congress, congress === BATASWATCH_CONGRESS).catch(() => null);
  if (!bills) return new Response("Source unavailable, try again shortly", { status: 503 });

  const cell = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    // Quote everything; neutralise spreadsheet formulas (=, +, -, @).
    return `"${(/^[=+\-@]/.test(s) ? `'${s}` : s).replace(/"/g, '""')}"`;
  };
  const rows = [
    ["Bill", "Congress", "Chamber", "Title", "Date filed", "Status", "Authors", "CivicSync page"],
    ...bills.map((b) => [
      b.label,
      b.congress,
      authorRole(b.label) === "Senator" ? "Senate" : "House",
      toTitleCase(b.title),
      b.dateFiled ?? "",
      b.status ?? "",
      b.authors.length ? b.authors.join("; ") : personName(person),
      `${SITE_URL}/bills/${b.routeId}`,
    ]),
  ];
  const csv = "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n") + "\r\n";
  const slug = personName(person).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slug}-bills-${filter}.csv"`,
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
