import { allRecentChanges } from "@/lib/statusHistory";
import { changeToSummary } from "@/lib/statusHistory";
import { toTitleCase } from "@/lib/format";
import { rssResponse } from "@/lib/rss";

/** Every recorded status change, newest first (CS-119). */
export async function GET() {
  const items = allRecentChanges.slice(0, 100).map((c) => {
    const b = changeToSummary(c);
    return { bill: { ...b, title: toTitleCase(b.title) }, date: c.date, guid: `${c.number}@${c.date}@${c.to}`, summary: `Was: ${c.from}` };
  });
  return rssResponse({
    title: "CivicSync PH: What changed",
    description: "Senate and House bills whose status changed, from a daily check of every 20th Congress bill.",
    path: "/feeds/changes",
    campaign: "feed-changes",
    items,
  });
}
