import data from "@/data/lawmakers.json";

/**
 * Current (20th Congress) members with their record, from data/lawmakers.json.
 * Built nightly by scripts/build-lawmakers.mts (see .github/workflows/lawmakers-data.yml).
 */
export interface Member {
  /** Open Congress ID; null for newer members not in Open Congress yet */
  id: string | null;
  name: string;
  lastName: string;
  chamber: "senate" | "house";
  position: string;
  representation: string | null;
  portraitUrl: string | null;
  /** Senate or House website profile (lists their bills and laws) */
  officialProfileUrl: string | null;
  congresses: { congress: number; bills: number | null }[];
  filedThisCongress: number;
  becameLaw: number;
  laws: { number: string; ra: string | null; title: string }[];
  totalOnRecord: number;
  congressesServed: number;
  topTopics: { label: string; count: number }[];
}

export const lawmakerData = data as unknown as { generatedAt: string; congress: number; billsScanned: number; members: Member[] };

/** Stable key for URLs: the Open Congress ID, or a name slug for newer members. */
export const memberKey = (m: Member) => m.id ?? `m-${m.lastName}-${m.name}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export function getMembers(keys: string[]): Member[] {
  const byKey = new Map(lawmakerData.members.map((m) => [memberKey(m), m]));
  return keys.map((k) => byKey.get(k)).filter((m): m is Member => !!m);
}
