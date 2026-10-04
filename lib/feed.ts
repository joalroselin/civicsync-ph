import { listMeasures, type BatasWatchMeasure } from "./batasWatch";
import { summaryFromBatasWatch, type BillSummary } from "./bills";
import { withAuthorLinks } from "./authorIndex";
import { changeToSummary, changesSince } from "./statusHistory";

/** A bill row for the home feed, with the date of its latest action when known. */
export type FeedBill = BillSummary & { chamber: "senate" | "house"; movedOn?: string };

const toFeed = (m: BatasWatchMeasure, movedOn?: string): FeedBill => ({
  ...summaryFromBatasWatch(m),
  chamber: m.chamber === "senate" ? "senate" : "house",
  movedOn,
});

/** Newest filings, a few per chamber so the Senate isn't drowned out by House volume. */
export async function newlyFiled(perChamber = 5): Promise<{ senate: FeedBill[]; house: FeedBill[] } | null> {
  const [senate, house] = await Promise.all([
    listMeasures({ chamber: "senate", sort: "latest" }).catch(() => null),
    listMeasures({ chamber: "house", sort: "latest" }).catch(() => null),
  ]);
  if (!senate && !house) return null;
  const pick = (items: BatasWatchMeasure[] = []) =>
    items.filter((m) => m.title || m.longTitle).slice(0, perChamber).map((m) => toFeed(m));
  const [s, h] = await Promise.all([withAuthorLinks(pick(senate?.items)), withAuthorLinks(pick(house?.items))]);
  return { senate: s, house: h };
}

/**
 * Bills that recently moved past committee, newest action first.
 *
 * BatasWatch has no "recently updated" sort, but its search matches status
 * text, and House statuses carry action dates ("Approved on Third Reading
 * on 2026-09-08"). Senate statuses carry no dates, so Senate movement can't
 * be dated from this source yet (needs our own daily snapshots; see CS-201).
 */
const MOVE_QUERIES: { q: string; pages: number }[] = [
  { q: "Approved by the House", pages: 3 },
  { q: "Approved on Third Reading", pages: 1 },
  { q: "Second Reading", pages: 1 },
  { q: "Business for the day", pages: 1 },
  { q: "Business for Thursday", pages: 1 },
  { q: "agreed to the request", pages: 1 },
];
const PROGRESSED = /approved|reading|business for|agreed|transmitted|enrolled|ratified|republic act/i;

export async function recentlyMoved(limit = 10, withinDays = 45): Promise<FeedBill[] | null> {
  const since = new Date(Date.now() - withinDays * 864e5).toISOString().slice(0, 10);
  const requests = MOVE_QUERIES.flatMap(({ q, pages }) =>
    Array.from({ length: pages }, (_, i) => listMeasures({ q, chamber: "house", sort: "latest", page: i + 1 }).catch(() => null))
  );
  const results = await Promise.all(requests);
  if (results.every((r) => r === null)) return null;

  const seen = new Map<string, FeedBill>();
  for (const m of results.flatMap((r) => r?.items ?? [])) {
    if (!m.status || !PROGRESSED.test(m.status) || seen.has(m.number)) continue;
    // Latest date in the status text = the most recent action.
    const dates = m.status.match(/\d{4}-\d{2}-\d{2}/g)?.sort() ?? [];
    const movedOn = dates[dates.length - 1];
    if (!movedOn || movedOn < since) continue;
    seen.set(m.number, toFeed(m, movedOn));
  }
  // Daily snapshot changes (CS-119): adds Senate moves, and House moves the
  // status search missed. Status-search rows win (they carry authors).
  for (const c of changesSince(withinDays, { progressOnly: true })) {
    const existing = seen.get(c.number);
    if (existing && (existing.movedOn ?? "") >= c.date) continue;
    seen.set(c.number, existing ? { ...existing, status: c.to, movedOn: c.date } : (changeToSummary(c) as FeedBill));
  }
  return withAuthorLinks([...seen.values()].sort((a, b) => b.movedOn!.localeCompare(a.movedOn!)).slice(0, limit));
}

/** Bills on record and filed in the last 7 days, for one chamber. */
export async function chamberPulse(chamber: "senate" | "house") {
  try {
    const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    let week = 0;
    let total = 0;
    // Newest first; stop once filings are older than a week (capped for politeness).
    for (let page = 1; page <= 8; page++) {
      const res = await listMeasures({ chamber, sort: "latest", page });
      total = res.total;
      const recent = res.items.filter((m) => (m.filedAt ?? "") > since).length;
      week += recent;
      if (recent < res.items.length || !res.hasMore) break;
    }
    return { total, week };
  } catch {
    return null;
  }
}
