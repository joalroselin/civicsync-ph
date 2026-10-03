import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { listMeasures, listPolicyAreas, toBatasWatchNumber } from "@/lib/batasWatch";

/**
 * Every 20th Congress bill and every lawmaker, so search engines can find
 * pages like "SB 1294 status" or "Hontiveros bills".
 *
 * Bill numbers are sequential, so we only fetch the latest number per
 * chamber and enumerate down from it (a few House numbers are unused and
 * simply 404). Older-Congress bills are reachable from lawmaker pages.
 */
export const revalidate = 86400;

const OPEN_CONGRESS = "https://open-congress-api.bettergov.ph/api";

async function latestNumber(chamber: "senate" | "house"): Promise<number> {
  try {
    const { items } = await listMeasures({ chamber, sort: "latest" });
    return Math.max(0, ...items.map((m) => Number(m.number.replace(/\D/g, "")) || 0));
  } catch {
    return 0;
  }
}

async function allPeopleIds(): Promise<string[]> {
  const ids: string[] = [];
  try {
    for (let offset = 0; offset < 5000; offset += 100) {
      const res = await fetch(`${OPEN_CONGRESS}/people?limit=100&offset=${offset}`, { next: { revalidate } });
      if (!res.ok) break;
      const json = await res.json();
      ids.push(...(json.data ?? []).map((p: { id: string }) => p.id));
      if (!json.pagination?.has_more) break;
    }
  } catch {
    // Partial list is better than none.
  }
  return ids;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [sb, hb, people, topics] = await Promise.all([latestNumber("senate"), latestNumber("house"), allPeopleIds(), listPolicyAreas().catch(() => [])]);

  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...["receipts", "topics", "feeds", "how-bills-become-law", "about", "get-involved", "press", "privacy"].map((p) => ({ url: `${SITE_URL}/${p}`, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];
  const bills = (subtype: "SB" | "HB", max: number): MetadataRoute.Sitemap =>
    Array.from({ length: max }, (_, i) => ({
      url: `${SITE_URL}/bills/${toBatasWatchNumber(subtype, max - i)}`,
      changeFrequency: "weekly",
      priority: 0.7,
    }));
  const lawmakers: MetadataRoute.Sitemap = people.map((id) => ({
    url: `${SITE_URL}/people/${id}`,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const topicPages: MetadataRoute.Sitemap = topics.map((t) => ({ url: `${SITE_URL}/topics/${t.id}`, changeFrequency: "daily", priority: 0.7 }));

  return [...pages, ...topicPages, ...lawmakers, ...bills("SB", sb), ...bills("HB", hb)];
}
