import { listPolicyAreas, semanticSearch } from "@/lib/batasWatch";
import { summaryFromSemantic } from "@/lib/bills";
import { toTitleCase } from "@/lib/format";
import { rssResponse } from "@/lib/rss";

/** Bills on one topic, newest filings first. */
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const topic = (await listPolicyAreas().catch(() => [])).find((t) => t.id === id);
  if (!topic) return new Response("Topic not found", { status: 404 });
  const hits = await semanticSearch({ q: `${topic.label}: ${topic.description}`, category: topic.label, limit: 50 }).catch(() => []);
  const bills = hits.map(summaryFromSemantic).sort((a, b) => (b.dateFiled ?? "").localeCompare(a.dateFiled ?? ""));
  return rssResponse({
    title: `CivicSync PH: ${topic.label} bills`,
    description: `${topic.description} Bills in the 20th Congress of the Philippines.`,
    path: `/feeds/topics/${id}`,
    campaign: `feed-topic-${id}`,
    items: bills.map((b) => ({ bill: { ...b, title: toTitleCase(b.title) }, date: b.dateFiled, guid: b.routeId, summary: b.summary })),
  });
}
