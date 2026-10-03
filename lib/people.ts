import { getPersonBills, type OpenCongressPerson } from "./openCongress";
import { authoredBy, listMeasures } from "./batasWatch";
import { getAuthorIndex, normName } from "./authorIndex";
import { summaryFromBatasWatch, summaryFromOpenCongress, type BillSummary } from "./bills";

/**
 * BatasWatch has no author filter, but its text search matches author
 * names; filter to exact authorship so shared surnames don't bleed in.
 */
export async function liveBills(
  person: OpenCongressPerson,
  page: number
): Promise<{ data: BillSummary[]; total: number | null; hasMore: boolean } | null> {
  // Prefer the exact names BatasWatch files this person under (e.g. Open
  // Congress's "Brian Daniel Llamanzares" is "POE, BRIAN" there).
  const known = (await getAuthorIndex()).namesById.get(person.id) ?? [];
  try {
    if (known.length) {
      const surname = known[0].split(",")[0].trim();
      const res = await listMeasures({ q: surname, sort: "latest", page });
      const names = new Set(known);
      const mine = res.items.filter((m) => (m.authorCredits ?? []).some((a) => names.has(normName(a.name))));
      return { data: mine.map(summaryFromBatasWatch), total: null, hasMore: res.hasMore };
    }
    const last = person.last_name ?? "";
    const surname = last.includes("-") ? last.split("-")[0] : last;
    const givenNames = [...(person.first_name?.split(/\s+/) ?? []), ...(person.aliases ?? [])];
    const res = await listMeasures({ q: surname, sort: "latest", page });
    const mine = res.items.filter((m) => authoredBy(m, { surname, givenNames }));
    return { data: mine.map(summaryFromBatasWatch), total: null, hasMore: res.hasMore };
  } catch {
    return null;
  }
}

/** Upper bounds so one export can't hammer the upstream APIs. */
const MAX_LIVE_PAGES = 20; // 600 search hits
const MAX_HISTORY = 3000;

/** Every authored bill for a congress (or all history), for CSV export. */
export async function allPersonBills(person: OpenCongressPerson, congress: number | undefined, live: boolean): Promise<BillSummary[]> {
  const out: BillSummary[] = [];
  if (live) {
    for (let page = 1; page <= MAX_LIVE_PAGES; page++) {
      const res = await liveBills(person, page);
      if (!res) break;
      out.push(...res.data);
      if (!res.hasMore) break;
    }
    return out;
  }
  for (let offset = 0; offset < MAX_HISTORY; offset += 100) {
    const res = await getPersonBills(person.id, { congress, limit: 100, offset });
    out.push(...res.data.map((b) => summaryFromOpenCongress(b)));
    if (!res.hasMore) break;
  }
  return out;
}
