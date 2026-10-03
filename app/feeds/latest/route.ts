import { listMeasures } from "@/lib/batasWatch";
import { summaryFromBatasWatch } from "@/lib/bills";
import { toTitleCase } from "@/lib/format";
import { rssResponse } from "@/lib/rss";

/** Newly filed bills, both chambers (30 newest of each). */
export async function GET() {
  const pages = await Promise.all([listMeasures({ chamber: "senate", sort: "latest" }), listMeasures({ chamber: "house", sort: "latest" })].map((p) => p.catch(() => null)));
  const bills = pages
    .flatMap((p) => p?.items ?? [])
    .filter((m) => m.title || m.longTitle)
    .map(summaryFromBatasWatch)
    .sort((a, b) => (b.dateFiled ?? "").localeCompare(a.dateFiled ?? ""));
  return rssResponse({
    title: "CivicSync PH: Newly filed bills",
    description: "New bills filed in the Philippine Senate and House of Representatives (20th Congress).",
    path: "/feeds/latest",
    campaign: "feed-latest",
    items: bills.map((b) => ({ bill: { ...b, title: toTitleCase(b.title) }, date: b.dateFiled, guid: b.routeId })),
  });
}
