import { recentlyMoved } from "@/lib/feed";
import { toTitleCase } from "@/lib/format";
import { rssResponse } from "@/lib/rss";

/** Bills that recently moved past committee (House for now; see CS-119). */
export async function GET() {
  const moved = (await recentlyMoved(40, 60).catch(() => null)) ?? [];
  return rssResponse({
    title: "CivicSync PH: Bills on the move",
    description: "House bills that passed a reading, were scheduled for debate, or moved between chambers. Senate moves coming soon.",
    path: "/feeds/moving",
    campaign: "feed-moving",
    // A new guid per move, so readers show the bill again when it moves again.
    items: moved.map((b) => ({ bill: { ...b, title: toTitleCase(b.title) }, date: b.movedOn ?? null, guid: `${b.routeId}@${b.movedOn}` })),
  });
}
