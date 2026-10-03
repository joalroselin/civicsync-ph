import { SITE_URL, withUtm } from "./site";
import type { BillSummary } from "./bills";

/** One feed item; `guid` changes when there's something new to say (e.g. a status move). */
export interface FeedItem {
  bill: BillSummary;
  date: string | null; // YYYY-MM-DD
  guid: string;
  summary?: string | null;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const rfc822 = (d: string | null) => new Date(d ? `${d}T08:00:00+08:00` : Date.now()).toUTCString();

/** RSS 2.0, readable in Feedly, Inoreader, Apple News-style readers, Zapier, Slack… */
export function rssResponse({ title, description, path, campaign, items }: { title: string; description: string; path: string; campaign: string; items: FeedItem[] }) {
  const self = `${SITE_URL}${path}`;
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(title)}</title>
<link>${SITE_URL}</link>
<description>${esc(description)}</description>
<language>en-ph</language>
<atom:link href="${esc(self)}" rel="self" type="application/rss+xml"/>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<ttl>60</ttl>
${items
  .map(({ bill, date, guid, summary }) => {
    const link = withUtm(`/bills/${bill.routeId}`, "rss", "feed", campaign);
    const parts = [
      bill.status ? `Status: ${bill.status}` : null,
      bill.authors.length ? `Authors: ${bill.authors.slice(0, 3).join(", ")}${bill.authors.length > 3 ? ` and ${bill.authors.length - 3} more` : ""}` : null,
      summary ?? null,
    ].filter(Boolean);
    return `<item>
<title>${esc(`${bill.label}: ${bill.title}`)}</title>
<link>${esc(link)}</link>
<guid isPermaLink="false">${esc(guid)}</guid>
<pubDate>${rfc822(date)}</pubDate>
<description>${esc(parts.join("\n\n"))}</description>
</item>`;
  })
  .join("\n")}
</channel>
</rss>
`;
  return new Response(body, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" },
  });
}
