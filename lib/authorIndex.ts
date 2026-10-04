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
import type { LawmakerProfile } from "./openCongress";
import { matchByName } from "./authorMatch";

const BW = "https://bills.juris.ph/api";
const OC = "https://open-congress-api.bettergov.ph/api";
const DAY = 86400;

interface BwAuthor {
  canonicalName: string;
  chamber: string;
  officialMemberId: string | null;
  portraitUrl?: string | null;
  portraitAttribution?: string | null;
  portraitLicense?: string | null;
  portraitSourceUrl?: string | null;
  representation?: string | null;
  position?: string | null;
  billCount?: number | null;
  officialProfileUrl?: string | null;
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
  /** Open Congress person ID → portrait, district/party-list, position */
  profileById: Map<string, LawmakerProfile>;
}

let cached: { at: number; index: Promise<AuthorIndex> } | null = null;

export function getAuthorIndex(): Promise<AuthorIndex> {
  if (cached && Date.now() - cached.at < DAY * 1000) return cached.index;
  const index = build().catch((err) => {
    console.error("Author index failed", err);
    cached = null;
    return { idByName: new Map(), namesById: new Map(), profileById: new Map() } as AuthorIndex;
  });
  cached = { at: Date.now(), index };
  return index;
}

async function build(): Promise<AuthorIndex> {
  const [authors, people] = await Promise.all([bwAuthors(), ocPeople()]);
  const byHouseKey = new Map<string, string>();
  for (const p of people) for (const k of p.congress_website_author_keys ?? []) byHouseKey.set(k, p.id);

  const idByName = new Map<string, string>();
  const profileById = new Map<string, LawmakerProfile>();
  for (const a of authors) {
    const id = a.chamber === "house" && a.officialMemberId ? byHouseKey.get(a.officialMemberId) : matchByName(a.canonicalName, people)?.id;
    if (!id) continue;
    idByName.set(normName(a.canonicalName), id);
    profileById.set(id, {
      portraitUrl: a.portraitUrl ?? null,
      representation: a.representation ?? null,
      position: a.position ?? null,
      photoCredit: a.portraitAttribution ? `${a.portraitAttribution}${a.portraitLicense ? ` (${a.portraitLicense.toLowerCase()})` : ""}` : null,
      photoSourceUrl: a.portraitSourceUrl ?? null,
      currentBillCount: a.billCount ?? null,
      officialProfileUrl: a.officialProfileUrl ?? null,
    });
  }
  const namesById = new Map<string, string[]>();
  for (const [name, id] of idByName) namesById.set(id, [...(namesById.get(id) ?? []), name]);
  return { idByName, namesById, profileById };
}

/** Adds `profile` (portrait, district, position) to current members; others pass through. */
export async function withProfiles<T extends { id: string; profile?: LawmakerProfile }>(people: T[]): Promise<T[]> {
  if (!people.length) return people;
  const { profileById } = await getAuthorIndex();
  return people.map((p) => (profileById.has(p.id) ? { ...p, profile: profileById.get(p.id) } : p));
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

/** Fills `firstAuthorId` so lists can link the author straight to their profile. */
export async function withAuthorLinks<T extends { firstAuthorKey?: string; firstAuthorId?: string | null }>(bills: T[]): Promise<T[]> {
  if (!bills.some((b) => b.firstAuthorKey)) return bills;
  const { idByName } = await getAuthorIndex();
  return bills.map((b) => (b.firstAuthorKey ? { ...b, firstAuthorId: idByName.get(normName(b.firstAuthorKey)) ?? null } : b));
}
