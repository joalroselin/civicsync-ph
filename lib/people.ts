import { getPerson, getPersonBills, searchPeople, type OpenCongressPerson } from "./openCongress";
import { authoredBy, fromBatasWatchNumber, listMeasures } from "./batasWatch";
import { getAuthorIndex, normName, withProfiles } from "./authorIndex";
import { summaryFromBatasWatch, summaryFromOpenCongress, type BillSummary } from "./bills";
import { ordinal } from "./format";
import { getMemberById, lawmakerData, type Member } from "./lawmakers";
import { nameMatches } from "./search";

function savedLawmaker(member: Member): OpenCongressPerson | null {
  if (!member.id) return null;
  const firstName = member.name.endsWith(` ${member.lastName}`)
    ? member.name.slice(0, -member.lastName.length).trimEnd()
    : member.name;
  // Saved Senate profile links include quoted nicknames that the snapshot's name omits.
  const nickname = member.officialProfileUrl?.split("/").at(-1)
    ?.replace(/%22/gi, '"').match(/"([^"]+)"/)?.[1].replace(/[-+]|%20/g, " ");

  return {
    id: member.id,
    first_name: firstName,
    last_name: member.lastName,
    middle_name: null,
    full_name: nickname ? `${firstName} "${nickname}" ${member.lastName}` : member.name,
    aliases: nickname ? [nickname] : [],
    congresses_served: member.congresses.map(({ congress }) => ({
      congress_number: congress,
      congress_ordinal: ordinal(congress),
      position: member.chamber === "senate" ? "Senator" : "Representative",
    })),
    profile: {
      portraitUrl: member.portraitUrl,
      representation: member.representation,
      position: member.position,
      photoCredit: null,
      photoSourceUrl: null,
      currentBillCount: member.filedThisCongress,
      snapshotAsOf: lawmakerData.generatedAt,
      officialProfileUrl: member.officialProfileUrl,
    },
  };
}

export async function loadLawmaker(id: string): Promise<OpenCongressPerson | null> {
  const person = await getPerson(id).catch(() => null);
  const member = getMemberById(id);
  const saved = member ? savedLawmaker(member) : null;
  if (!person) return saved;
  const [profile] = await withProfiles([{ ...person, profile: person.profile ?? saved?.profile }]);
  return profile;
}

export async function findLawmakers(q: string): Promise<OpenCongressPerson[]> {
  const matches = await searchPeople({ q, limit: 8 })
    .then((people) => people.filter((person) => nameMatches(person, q)).slice(0, 6))
    .catch(() => []);
  if (matches.length) return withProfiles(matches);

  const saved: OpenCongressPerson[] = [];
  for (const member of lawmakerData.members) {
    const person = savedLawmaker(member);
    if (!person || !nameMatches(person, q)) continue;
    saved.push(person);
    if (saved.length === 6) break;
  }
  return saved;
}

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
  const known = person.profile?.snapshotAsOf ? [] : (await getAuthorIndex()).namesById.get(person.id) ?? [];
  const chamber = person.profile?.snapshotAsOf ? getMemberById(person.id)?.chamber : undefined;
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
    const res = await listMeasures({ q: surname, chamber, sort: "latest", page });
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

// --- Lawmaker record: counts per congress and laws (CS-302) ----------------

/** Status text BatasWatch uses once a bill is law, e.g. "REPUBLIC ACT RA12324 (Lapsed into law on …)". */
const BECAME_LAW = /republic act|lapsed into law|approved by the president/i;

export interface LawmakerRecord {
  /** All bills on record, every congress: Open Congress history plus the live 20th Congress count. */
  totalOnRecord: number | null;
  /** Bills per congress served, newest first. 20th Congress uses the live count. */
  byCongress: { congress: number; bills: number | null }[];
  snapshotAsOf?: string;
  /** 20th Congress only: what's filed so far and which became law. */
  current: { filed: number | null; becameLaw: BillSummary[] } | null;
}

export async function getLawmakerRecord(person: OpenCongressPerson): Promise<LawmakerRecord> {
  const saved = getMemberById(person.id);
  if (saved && person.profile?.snapshotAsOf) {
    return {
      totalOnRecord: saved.totalOnRecord,
      byCongress: saved.congresses,
      snapshotAsOf: person.profile.snapshotAsOf,
      current: {
        filed: saved.filedThisCongress,
        becameLaw: saved.laws.map((law) => {
          const number = fromBatasWatchNumber(law.number);
          return {
            routeId: law.number,
            label: number ? `${number.subtype} ${number.number}` : law.number,
            congress: 20,
            title: law.title,
            dateFiled: null,
            status: law.ra ? `Republic Act RA${law.ra}` : "Became law",
            authors: [],
          };
        }),
      },
    };
  }

  const congresses = [...new Set((person.congresses_served ?? []).map((c) => c.congress_number))].sort((a, b) => b - a);
  const servesNow = congresses.includes(20);
  const count = (congress?: number) =>
    getPersonBills(person.id, { congress, limit: 1 })
      .then((r) => r.total)
      .catch(() => null);

  const [totalOnRecord, perCongress, laws] = await Promise.all([
    count(),
    Promise.all(congresses.map(async (c) => ({ congress: c, bills: c === 20 && person.profile?.currentBillCount != null ? person.profile.currentBillCount : await count(c) }))),
    servesNow ? currentLaws(person) : Promise.resolve(null),
  ]);
  // Open Congress stops around Sept 2025, so its 20th Congress count is short.
  // Total = its count for earlier congresses + the live 20th Congress count.
  const oc20 = servesNow ? await count(20) : null;
  const live20 = perCongress.find((c) => c.congress === 20)?.bills ?? null;
  const total = totalOnRecord == null ? null : servesNow && oc20 != null && live20 != null ? totalOnRecord - oc20 + live20 : totalOnRecord;
  const useSavedCounts = saved !== null && (total === null || perCongress.some(({ bills }) => bills === null));
  return {
    totalOnRecord: total ?? saved?.totalOnRecord ?? null,
    byCongress: perCongress.map(({ congress, bills }) => ({
      congress,
      bills: bills ?? saved?.congresses.find((entry) => entry.congress === congress)?.bills ?? null,
    })),
    snapshotAsOf: useSavedCounts ? lawmakerData.generatedAt : person.profile?.snapshotAsOf,
    current: servesNow ? { filed: person.profile?.currentBillCount ?? perCongress.find((c) => c.congress === 20)?.bills ?? null, becameLaw: laws ?? [] } : null,
  };
}

/** Walks the lawmaker's live 20th Congress list and keeps bills whose status says they became law. */
async function currentLaws(person: OpenCongressPerson): Promise<BillSummary[]> {
  const out: BillSummary[] = [];
  for (let page = 1; page <= MAX_LIVE_PAGES; page++) {
    const res = await liveBills(person, page);
    if (!res) break;
    out.push(...res.data.filter((b) => b.status && BECAME_LAW.test(b.status)));
    if (!res.hasMore) break;
  }
  return out;
}
