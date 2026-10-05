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
import { matchByName } from "../lib/authorMatch.ts";

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

/** "ACOP, PHILIP CONRAD M." → "Philip Conrad M. Acop" */
const displayName = (c: string) => {
  const [last, first = ""] = c.split(",").map((x) => x.trim());
  const cap = (x: string) => x.toLowerCase().replace(/(^|[\s"(-])(\p{L})/gu, (_, p, ch) => p + ch.toUpperCase());
  return `${cap(first)} ${cap(last)}`.trim();
};
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
/**
 * Current-Congress list first; then all of Open Congress by surname, since
 * some members aren't tagged with the 20th Congress there yet.
 */
async function findPerson(a: any): Promise<any | null> {
  if (a.chamber === "house" && a.officialMemberId && byHouseKey.has(a.officialMemberId)) return byHouseKey.get(a.officialMemberId);
  const local = matchByName(a.canonicalName, ocPeople);
  if (local) return local;
  const surname = a.canonicalName.split(",")[0].replace(/\b(JR|SR|II|III|IV)\.?\b/gi, "").trim();
  const found: any[] = (await get(`${OC}/search/people?q=${encodeURIComponent(surname)}&limit=20`).catch(() => null))?.data ?? [];
  if (a.officialMemberId) {
    const byCode = found.find((p) => (p.congress_website_author_keys ?? []).includes(a.officialMemberId));
    if (byCode) return byCode;
  }
  return matchByName(a.canonicalName, found);
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
// Co-authors (bills with up to 10 authors, so big group bills don't drown out
// real working relationships) and the committees their bills are sent to.
const coAuthorsByName = new Map<string, Map<string, number>>();
const committeesByName = new Map<string, Map<string, number>>();
const bump = (m: Map<string, Map<string, number>>, k: string, v: string) => {
  const inner = m.get(k) ?? new Map<string, number>();
  inner.set(v, (inner.get(v) ?? 0) + 1);
  m.set(k, inner);
};
const topicsByName = new Map<string, Map<string, number>>();
for (const m of measures) {
  const names = (m.authorCredits ?? []).map((a: any) => norm(a.name));
  const law = m.status && BECAME_LAW.test(m.status);
  const topic = m.analysis?.primaryPolicyArea;
  const committee = m.primaryCommittee ? String(m.primaryCommittee).trim() : null;
  for (const n of names) {
    if (names.length <= 10) for (const other of names) if (other !== n) bump(coAuthorsByName, n, other);
    if (committee) bump(committeesByName, n, committee);
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
  const oc = await findPerson(a);
  // Not in Open Congress yet (newer members): keep them, current Congress only.
  const person = oc ? (await get(`${OC}/people/${oc.id}?include_congresses=true`).catch(() => null))?.data : null;
  // Always include the 20th Congress: they're a current member even if the record lags.
  const served: number[] = [...new Set<number>([20, ...(person?.congresses_served ?? []).map((c: any) => c.congress_number)])].sort((x, y) => y - x);
  const congresses = await Promise.all(
    served.map(async (c) => ({
      congress: c,
      bills:
        c === 20
          ? (a.billCount as number)
          : oc
            ? ((await get(`${OC}/people/${oc.id}/documents?congress=${c}&limit=1`).catch(() => null))?.pagination?.total ?? null)
            : null,
    }))
  );
  const key = norm(a.canonicalName);
  const laws = lawsByName.get(key) ?? [];
  const topics = [...(topicsByName.get(key) ?? new Map()).entries()].sort((x, y) => y[1] - x[1]).slice(0, 5);
  const totalOnRecord = congresses.reduce((s, c) => s + (c.bills ?? 0), 0);
  const top = (m: Map<string, number> | undefined, n: number) => [...(m ?? new Map()).entries()].sort((x, y) => y[1] - x[1]).slice(0, n);
  return {
    id: oc?.id ?? null,
    name: oc ? [oc.first_name, oc.last_name].filter(Boolean).join(" ") : displayName(a.canonicalName),
    lastName: oc?.last_name ?? a.canonicalName.split(",")[0].trim(),
    chamber: a.chamber as "senate" | "house",
    position: a.position ?? (a.chamber === "senate" ? "Senator" : "Representative"),
    representation: a.representation ?? null,
    portraitUrl: a.portraitUrl ?? null,
    officialProfileUrl: a.officialProfileUrl ?? null,
    congresses,
    filedThisCongress: a.billCount ?? 0,
    becameLaw: laws.length,
    laws,
    totalOnRecord,
    congressesServed: served.length,
    topTopics: topics.map(([label, count]) => ({ label, count })),
    // Raw co-author names here; linked to members after all rows exist.
    coAuthors: top(coAuthorsByName.get(key), 5).filter(([, c]) => c >= 2).map(([name, count]) => ({ key: name, count })),
    committees: top(committeesByName.get(key), 3).map(([name, count]) => ({ name, count })),
  };
});

const members = rows.filter(Boolean).sort((x: any, y: any) => x.lastName.localeCompare(y.lastName));
// Link co-authors to members (by their source name) so the page can link them.
{
  const byCanonical = new Map<string, any>();
  authors.forEach((a: any, i: number) => rows[i] && byCanonical.set(norm(a.canonicalName), rows[i]));
  for (const m of members as any[])
    m.coAuthors = m.coAuthors.map((c: any) => {
      const other = byCanonical.get(c.key);
      return { id: other?.id ?? null, name: other?.name ?? displayName(c.key), count: c.count };
    });
}
const unmatched = members.filter((m: any) => !m.id).map((m: any) => m.name);
mkdirSync(new URL("../data/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../data/lawmakers.json", import.meta.url),
  JSON.stringify({ generatedAt: new Date().toISOString(), congress: 20, billsScanned: measures.length, members }, null, 1) + "\n"
);
log(`Wrote ${members.length} members; not in Open Congress yet: ${unmatched.join(", ") || "none"}`);

// 5. Daily status snapshot and what changed since the last run (CS-119).
//    data/status/latest.json   every bill's current status
//    data/status/changes.json  changes from the last 120 days, newest first (the app reads this)
//    data/status/archive/YYYY-MM.json  every change, by month (history; open data)
{
  const dir = new URL("../data/status/", import.meta.url);
  mkdirSync(new URL("archive/", dir), { recursive: true });
  const { existsSync, readFileSync } = await import("node:fs");
  const read = (f: URL, fallback: any) => (existsSync(f) ? JSON.parse(readFileSync(f, "utf8")) : fallback);
  // House statuses carry a "(Filed last …)" note that changes without the bill moving.
  const clean = (s: string | null) => (s ?? "").replace(/\s*\(Filed last[^)]*\)\s*$/i, "").trim();
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });

  const prevFile = new URL("latest.json", dir);
  const prev: { date?: string; bills?: Record<string, { s: string }> } = read(prevFile, {});
  const complete = measures.length >= first.meta.total * 0.97;
  const bills: Record<string, { s: string; c: "senate" | "house" }> = {};
  const titles: Record<string, string> = {};
  for (const m of measures) {
    bills[m.number] = { s: clean(m.status), c: m.chamber === "senate" ? "senate" : "house" };
    titles[m.number] = (m.title ?? m.longTitle ?? "").slice(0, 160);
  }

  const changes: { date: string; number: string; chamber: string; title: string; from: string; to: string }[] = [];
  if (prev.bills && complete) {
    for (const [number, b] of Object.entries(bills)) {
      const before = prev.bills[number];
      if (before && before.s !== b.s && b.s) changes.push({ date: today, number, chamber: b.c, title: titles[number], from: before.s, to: b.s });
    }
  }
  if (!complete) log(`Scan incomplete (${measures.length}/${first.meta.total}): kept the previous snapshot, no changes recorded`);
  else {
    // One bill per line, sorted, so each night's git diff is just the bills that changed.
    const lines = Object.keys(bills)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${JSON.stringify(bills[k])}`);
    writeFileSync(prevFile, `{"date":${JSON.stringify(today)},"count":${measures.length},"bills":{\n${lines.join(",\n")}\n}}\n`);
    // Recent changes for the app (replace today's entries so re-runs don't duplicate).
    const recentFile = new URL("changes.json", dir);
    const cutoff = new Date(Date.now() - 120 * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    const recent = read(recentFile, { since: today, changes: [] });
    recent.changes = [...changes, ...recent.changes.filter((c: any) => c.date !== today && c.date >= cutoff)];
    recent.updated = today;
    writeFileSync(recentFile, JSON.stringify(recent, null, 0).replace(/\},\{/g, "},\n{") + "\n");
    // Monthly archive keeps everything.
    const archiveFile = new URL(`archive/${today.slice(0, 7)}.json`, dir);
    const archive = read(archiveFile, []);
    writeFileSync(archiveFile, JSON.stringify([...changes, ...archive.filter((c: any) => c.date !== today)], null, 0).replace(/\},\{/g, "},\n{") + "\n");
    log(prev.bills ? `${changes.length} status changes since ${prev.date}` : "First snapshot saved (changes start tomorrow)");
  }
}

// 6. Search index of every 20th Congress bill (CS-306) and the last-known
//    status the site falls back to when BatasWatch is down (CS-903).
//    data/search/bills-20.json: one bill per line, newest first.
{
  if (measures.length < first.meta.total * 0.97) log("Scan incomplete: kept the previous search index");
  else {
    mkdirSync(new URL("../data/search/", import.meta.url), { recursive: true });
    const display = (raw?: string) => {
      if (!raw) return "";
      const [last, given = ""] = raw.split(",").map((x) => x.trim());
      const cap = (x: string) => x.toLowerCase().replace(/(^|[\s"(-])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
      return given ? `${cap(given)} ${cap(last)}` : cap(last);
    };
    const rows = [...measures]
      .filter((m) => m.number)
      .sort((a, b) => (b.filedAt ?? "").localeCompare(a.filedAt ?? "") || b.number.localeCompare(a.number))
      .map((m) =>
        JSON.stringify({
          n: m.number,
          c: m.chamber === "senate" ? "s" : "h",
          t: (m.title ?? m.longTitle ?? "").replace(/\s+/g, " ").trim(),
          a: display(m.authorCredits?.[0]?.name ?? m.primaryAuthors?.[0]),
          k: m.authorCredits?.length ?? m.primaryAuthors?.length ?? 0,
          s: (m.status ?? "").replace(/\s+/g, " ").trim(),
          f: m.filedAt ?? null,
          p: m.analysis?.primaryPolicyArea ?? null,
          o: m.officialRecordUrl ?? null,
        })
      );
    const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
    writeFileSync(new URL("../data/search/bills-20.json", import.meta.url), `{"date":${JSON.stringify(today)},"bills":[\n${rows.join(",\n")}\n]}\n`);
    log(`Search index: ${rows.length} bills`);
  }
}
