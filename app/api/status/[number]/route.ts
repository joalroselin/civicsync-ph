import { loadEmbedBill } from "@/lib/embed";
import { parseBillNumber } from "@/lib/openCongress";
import { toBatasWatchNumber } from "@/lib/batasWatch";
import { displayStatus } from "@/lib/format";
import { withUtm } from "@/lib/site";

/**
 * GET /api/status/SB1294 → { label, title, status, byline, url }
 * Small, cached, public (CORS *) lookup for the browser extension (CS-115)
 * and anyone else. 20th Congress numbers.
 */
export async function GET(_req: Request, props: { params: Promise<{ number: string }> }) {
  const { number } = await props.params;
  const parsed = parseBillNumber(decodeURIComponent(number));
  const headers = { "Access-Control-Allow-Origin": "*", "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" };
  if (!parsed) return Response.json({ error: "Not a bill number" }, { status: 400, headers });
  const id = toBatasWatchNumber(parsed.subtype, parsed.number)!;
  const bill = await loadEmbedBill(id);
  if (!bill) return Response.json({ error: "Not found" }, { status: 404, headers });
  return Response.json(
    {
      label: bill.label,
      title: bill.title,
      chamber: bill.chamber,
      congress: bill.congress,
      status: displayStatus(bill.status),
      tone: bill.tone,
      byline: bill.byline,
      url: withUtm(`/bills/${id}`, "extension", "browser", "bill-hover"),
    },
    { headers }
  );
}
