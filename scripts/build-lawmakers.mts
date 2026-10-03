/**
 * Builds data/lawmakers.json: one row per current (20th Congress) member,
 * with bills filed per congress, bills that became law this Congress, and
 * top topics. Powers /lawmakers and /compare (CS-304).
 *
 *   node scripts/build-lawmakers.mts
 *
 * Too slow for a page request (~14,000 bill statuses, ~1,000 count lookups),
 * so a nightly GitHub Action runs it and commits the file. Polite to the
 * sources: a few requests at a time, with retries.
 */
import { mkdirSync, writeFileSync } from "node:fs";

const BW = "https://bills.juris.ph/api";
const OC = "https://open-congress-api.bettergov.ph/api";
const CONCURRENCY = 4;
const BECAME_LAW = /republic act|lapsed into law|approved by the president/i;

async function get(url: string, tries = 4): Promise<any> {
  for (let i = 0; ; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`${res.status} ${url}`);
      return await res.json();
    } catch (err) {
      if (i >= tries - 1) throw err;
      await new Promise((r) => setTimeout(r, 1000 * 2 ** i));
    }
  }
}

/** Run `fn` over items with limited concurrency. */
async function pool<T, R>(items: T[], fn: (t: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: CONCURRENCY }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    })
  );
  return out;
}

const norm = (s: string) => s.toUpperCase().replace(/\s+/g, " ").trim();
const log = (...a: unknown[]) => console.log(new Date().toISOString().slice(11, 19), ...a);

// 1. Current members from BatasWatch (codes, counts, portraits)
log("BatasWatch authors…");
const authors: any[] = (await get(`${BW}/authors?congress=20&limit=500`)).items;

// 2. Open Congress people in the 20th Congress (IDs + House member codes)
log("Open Congress people…");
const ocPeople: any[] = [];
for (let offset = 0; ; offset += 100) {
  const j = await get(`${OC}/people?congress=20&limit=100&offset=${offset}`);
  ocPeople.push(...j.data);
  if (!j.pagination?.has_more) break;
}
const byHouseKey = new Map<string, any>();
for (const p of ocPeople) for (const k of p.congress_website_author_keys ?? []) byHouseKey.set(k, p);
function matchSenator(canonical: string) {
  const [last, first = ""] = canonical.toUpperCase().split(",");
  const given = first.replace(/"[^"]*"/g, " ").split(/[\s.]+/).filter((g) => g.length > 1);
  const hits = ocPeople.filter((p) => {
    const pl = (p.last_name ?? "").toUpperCase();
    const names = [...(p.first_name ?? "").toUpperCase().split(/\s+/), ...(p.aliases ?? []).map((a: string) => a.toUpperCase())];
    return (pl === last.trim() || pl.split("-").includes(last.trim())) && given.some((g) => names.includes(g));
  });
  return hits.length === 1 ? hits[0] : null;
}

// 3. Every 20th Congress bill: who filed it, did it become law, topic
log("Scanning 20th Congress bills…");
const first = await get(`${BW}/measures?sort=latest&page=1`);
const pages = Math.ceil(first.meta.total / first.meta.perPage);
const measures: any[] = [...first.items];
const rest = await pool(
  Array.from({ length: pages - 1 }, (_, i) => i + 2),
  (p) => get(`${BW}/measures?sort=latest&page=${p}`).then((j) => j.items as any[]).catch(() => [] as any[])
);
for (const r of rest) measures.push(...r);
log(`${measures.length} bills read of ${first.meta.total}`);

const lawsByName = new Map<string, { number: string; ra: string | null; title: string }[]>();
const topicsByName = new Map<string, Map<string, number>>();
for (const m of measures) {
  const names = (m.authorCredits ?? []).map((a: any) => norm(a.name));
  const law = m.status && BECAME_LAW.test(m.status);
  const topic = m.analysis?.primaryPolicyArea;
  for (const n of names) {
    if (law) {
      const list = lawsByName.get(n) ?? [];
      list.push({ number: m.number, ra: m.status.match(/RA\s?(\d{4,6})/i)?.[1] ?? null, title: m.title ?? m.longTitle ?? "" });
      lawsByName.set(n, list);
    }
    if (topic && topic !== "Other") {
      const t = topicsByName.get(n) ?? new Map();
      t.set(topic, (t.get(topic) ?? 0) + 1);
      topicsByName.set(n, t);
    }
  }
}

// 4. Per member: service record + bills per earlier congress (Open Congress)
log("Per-congress counts…");
const rows = await pool(authors, async (a) => {
  const oc = a.chamber === "house" && a.officialMemberId ? byHouseKey.get(a.officialMemberId) : matchSenator(a.canonicalName);
  if (!oc) return null;
  const person = (await get(`${OC}/people/${oc.id}?include_congresses=true`).catch(() => null))?.data;
  // Always include the 20th Congress: they're a current member even if the record lags.
  const served: number[] = [...new Set<number>([20, ...(person?.congresses_served ?? []).map((c: any) => c.congress_number)])].sort((x, y) => y - x);
  const congresses = await Promise.all(
    served.map(async (c) => ({
      congress: c,
      bills:
        c === 20
          ? (a.billCount as number)
          : ((await get(`${OC}/people/${oc.id}/documents?congress=${c}&limit=1`).catch(() => null))?.pagination?.total ?? null),
    }))
  );
  const key = norm(a.canonicalName);
  const laws = lawsByName.get(key) ?? [];
  const topics = [...(topicsByName.get(key) ?? new Map()).entries()].sort((x, y) => y[1] - x[1]).slice(0, 5);
  const totalOnRecord = congresses.reduce((s, c) => s + (c.bills ?? 0), 0);
  return {
    id: oc.id,
    name: [oc.first_name, oc.last_name].filter(Boolean).join(" "),
    lastName: oc.last_name,
    chamber: a.chamber as "senate" | "house",
    position: a.position ?? (a.chamber === "senate" ? "Senator" : "Representative"),
    representation: a.representation ?? null,
    portraitUrl: a.portraitUrl ?? null,
    congresses,
    filedThisCongress: a.billCount ?? 0,
    becameLaw: laws.length,
    laws,
    totalOnRecord,
    congressesServed: served.length,
    topTopics: topics.map(([label, count]) => ({ label, count })),
  };
});

const members = rows.filter(Boolean).sort((x: any, y: any) => x.lastName.localeCompare(y.lastName));
mkdirSync(new URL("../data/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../data/lawmakers.json", import.meta.url),
  JSON.stringify({ generatedAt: new Date().toISOString(), congress: 20, billsScanned: measures.length, members }, null, 1) + "\n"
);
log(`Wrote ${members.length} members (${authors.length - members.length} unmatched)`);
