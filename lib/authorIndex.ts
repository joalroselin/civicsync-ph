/**
 * Links BatasWatch author names to Open Congress lawmaker profiles.
 *
 * The two sources sometimes record the same person differently: Open
 * Congress has "Brian Daniel Llamanzares", BatasWatch has "POE, BRIAN".
 * Searching by surname then finds the wrong Poe. So:
 * - House: both carry the official House member code (e.g. "L055"), a
 *   reliable join.
 * - Senate (24 members, different codes): match surname + a given name,
 *   and only when exactly one senator fits.
 */
const BW = "https://bills.juris.ph/api";
const OC = "https://open-congress-api.bettergov.ph/api";
const DAY = 86400;

interface BwAuthor {
  canonicalName: string;
  chamber: string;
  officialMemberId: string | null;
}
interface OcPerson {
  id: string;
  first_name: string | null;
  last_name: string | null;
  aliases?: string[] | null;
  congress_website_author_keys?: string[] | null;
}

export const normName = (s: string) => s.toUpperCase().replace(/\s+/g, " ").trim();

export interface AuthorIndex {
  /** Normalised BatasWatch name → Open Congress person ID */
  idByName: Map<string, string>;
  /** Open Congress person ID → every BatasWatch name they appear under */
  namesById: Map<string, string[]>;
}

let cached: { at: number; index: Promise<AuthorIndex> } | null = null;

export function getAuthorIndex(): Promise<AuthorIndex> {
  if (cached && Date.now() - cached.at < DAY * 1000) return cached.index;
  const index = build().catch((err) => {
    console.error("Author index failed", err);
    cached = null;
    return { idByName: new Map(), namesById: new Map() } as AuthorIndex;
  });
  cached = { at: Date.now(), index };
  return index;
}

async function build(): Promise<AuthorIndex> {
  const [authors, people] = await Promise.all([bwAuthors(), ocPeople()]);
  const byHouseKey = new Map<string, string>();
  for (const p of people) for (const k of p.congress_website_author_keys ?? []) byHouseKey.set(k, p.id);

  const idByName = new Map<string, string>();
  for (const a of authors) {
    const id = a.chamber === "house" && a.officialMemberId ? byHouseKey.get(a.officialMemberId) : matchByName(a.canonicalName, people);
    if (id) idByName.set(normName(a.canonicalName), id);
  }
  const namesById = new Map<string, string[]>();
  for (const [name, id] of idByName) namesById.set(id, [...(namesById.get(id) ?? []), name]);
  return { idByName, namesById };
}

/** "TULFO, ERWIN T." → the one 20th Congress lawmaker with that surname and given name, if unique. */
function matchByName(canonical: string, people: OcPerson[]): string | undefined {
  const [last, first = ""] = canonical.toUpperCase().split(",");
  const surname = last.trim();
  const given = first.replace(/"[^"]*"/g, " ").split(/[\s.]+/).filter((g) => g.length > 1);
  const hits = people.filter((p) => {
    const pl = (p.last_name ?? "").toUpperCase();
    const surnameOk = pl === surname || pl.split("-").includes(surname);
    const names = [...(p.first_name ?? "").toUpperCase().split(/\s+/), ...(p.aliases ?? []).map((a) => a.toUpperCase())];
    return surnameOk && given.some((g) => names.includes(g));
  });
  return hits.length === 1 ? hits[0].id : undefined;
}

async function bwAuthors(): Promise<BwAuthor[]> {
  const res = await fetch(`${BW}/authors?congress=20&limit=500`, { next: { revalidate: DAY }, signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`BatasWatch authors ${res.status}`);
  return (await res.json()).items ?? [];
}

async function ocPeople(): Promise<OcPerson[]> {
  const out: OcPerson[] = [];
  for (let offset = 0; offset < 1000; offset += 100) {
    const res = await fetch(`${OC}/people?congress=20&limit=100&offset=${offset}`, { next: { revalidate: DAY }, signal: AbortSignal.timeout(10_000) });
    if (!res.ok) throw new Error(`Open Congress people ${res.status}`);
    const json = await res.json();
    out.push(...(json.data ?? []));
    if (!json.pagination?.has_more) break;
  }
  return out;
}
