import { indexedBill, indexDate } from "@/lib/billIndex";
import { billHistory } from "@/lib/statusHistory";
import { fromBatasWatchNumber } from "@/lib/batasWatch";
import { displayStatus, toTitleCase } from "@/lib/format";
import { rssResponse, type FeedItem } from "@/lib/rss";
import { BILL_ID } from "@/lib/push";

/**
 * A personal feed for the bills you follow (CS-113):
 * /feeds/watchlist?b=SBN-1294,HB04659
 * Each bill's current status, plus every change we've recorded. The bill IDs
 * are in the link itself, so no account is needed.
 */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("b") ?? "")
    .split(",")
    .map((s) => s.trim().toUpperCase())
    .filter((s) => BILL_ID.test(s))
    .slice(0, 200);
  const items: FeedItem[] = [];
  for (const id of ids) {
    const b = indexedBill(id);
    if (!b) continue;
    const p = fromBatasWatchNumber(b.n);
    const bill = {
      routeId: b.n,
      label: p ? `${p.subtype} ${p.number}` : b.n,
      congress: 20,
      title: toTitleCase(b.t || "Untitled bill"),
      dateFiled: b.f,
      status: displayStatus(b.s || "Filed"),
      authors: b.a ? [b.a] : [],
    };
    const history = billHistory(b.n);
    // Newest change first; if none recorded yet, one item for its current status.
    if (history.length)
      for (const c of history) items.push({ bill: { ...bill, status: displayStatus(c.to) }, date: c.date, guid: `${b.n}@${c.date}@${c.to}`, summary: `Was: ${displayStatus(c.from)}` });
    else items.push({ bill, date: b.f ?? indexDate(), guid: `${b.n}@${b.s}`, summary: null });
  }
  items.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
  return rssResponse({
    title: "CivicSync PH: My Watchlist",
    description: "Status updates for the Philippine bills you follow, from a daily check.",
    path: `/feeds/watchlist?b=${ids.join(",")}`,
    campaign: "feed-watchlist",
    items,
  });
}
