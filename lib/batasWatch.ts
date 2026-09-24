/**
 * Client for BatasWatch (bills.juris.ph) — the source for live bill status
 * and committee referral, which Open Congress does not carry.
 *
 * ⚠️ Independent, unauthenticated, unattributed-maintainer source, 20th
 * Congress only. Decided in the v1.1 roadmap: start here, revisit if it
 * proves unreliable in practice.
 *
 * Response shape verified against live `GET /api/measures?q=` (Sept 2026):
 * `{ items: BatasWatchMeasure[], meta: {...} }`. Number formats differ by
 * chamber — Senate is "SBN-1294", House is "HB04659" (zero-padded to 5).
 * `q` is a fuzzy search, so results must be matched on `number` exactly.
 */

const BASE_URL = "https://bills.juris.ph/api";

/** Status moves daily at most; 30 minutes keeps us polite and fresh. */
const REVALIDATE_SECONDS = 1800;

export interface BatasWatchMeasure {
  id: string;
  congress: number;
  chamber: "house" | "senate" | string;
  number: string;
  title: string | null;
  longTitle: string | null;
  filedAt: string | null;
  status: string | null;
  primaryAuthors?: string[];
  authorCredits?: { name: string; role?: string }[];
  primaryCommittee?: string | null;
  secondaryCommittees?: string[];
  documentVersions?: { label: string; url: string }[];
  officialRecordUrl?: string | null;
  analysis?: {
    overview?: string;
    purpose?: string;
    primaryPolicyArea?: string;
    policyAreas?: string[];
    keywords?: string[];
    generatedAt?: string;
  } | null;
}

export const BATASWATCH_CONGRESS = 20;

/** Map an Open Congress subtype + number to BatasWatch's number format. */
export function toBatasWatchNumber(subtype: string, billNumber: number): string | null {
  if (subtype === "SB") return `SBN-${billNumber}`;
  if (subtype === "HB") return `HB${String(billNumber).padStart(5, "0")}`;
  return null;
}

async function fetchMeasures(params: Record<string, string | number | undefined>) {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  );
  const res = await fetch(`${BASE_URL}/measures?${qs}`, {
    next: { revalidate: REVALIDATE_SECONDS },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`BatasWatch measures failed: ${res.status}`);
  const json = await res.json();
  return {
    items: (Array.isArray(json?.items) ? json.items : []) as BatasWatchMeasure[],
    total: Number(json?.meta?.total ?? 0),
    perPage: Number(json?.meta?.perPage ?? 30),
  };
}

/**
 * List/search 20th Congress measures. `sort: "latest"` orders by filing date.
 * Page size is fixed upstream at 30.
 */
export async function listMeasures(params: {
  q?: string;
  chamber?: "senate" | "house";
  sort?: "latest";
  page?: number;
}) {
  const { items, total, perPage } = await fetchMeasures(params);
  const page = params.page ?? 1;
  return { items, total, hasMore: page * perPage < total };
}

/** Exact lookup by BatasWatch number, e.g. "SBN-1294" or "HB04659". */
export async function getMeasureByNumber(number: string): Promise<BatasWatchMeasure | null> {
  const { items } = await fetchMeasures({ q: number });
  return items.find((m) => m.number === number) ?? null;
}

export async function getMeasureStatus(
  subtype: string,
  billNumber: number,
  congress: number
): Promise<BatasWatchMeasure | null> {
  if (congress !== BATASWATCH_CONGRESS) return null;
  const number = toBatasWatchNumber(subtype, billNumber);
  if (!number) return null;
  try {
    return await getMeasureByNumber(number);
  } catch (err) {
    // Fail soft: a status source outage shouldn't break the authorship view.
    console.error(err);
    return null;
  }
}

/** "SBN-1294" → { subtype: "SB", number: 1294 }; "HB04659" → { "HB", 4659 } */
export function fromBatasWatchNumber(number: string): { subtype: "SB" | "HB"; number: number } | null {
  const m = number.match(/^(SBN-|HB)0*(\d+)$/);
  if (!m) return null;
  return { subtype: m[1] === "HB" ? "HB" : "SB", number: Number(m[2]) };
}

/**
 * BatasWatch author names look like "HONTIVEROS, RISA" or "TULFO, ERWIN T.".
 * Several lawmakers share surnames (four Tulfos), so require the surname
 * plus a given name or alias to match.
 */
export function authoredBy(
  m: BatasWatchMeasure,
  person: { surname: string; givenNames: string[] }
): boolean {
  const surname = person.surname.toUpperCase();
  const given = person.givenNames.map((g) => g.toUpperCase()).filter((g) => g.length > 1);
  return (m.authorCredits ?? []).some(({ name }) => {
    const [last, first = ""] = name.toUpperCase().split(",");
    return last.includes(surname) && given.some((g) => first.split(/[\s".]+/).includes(g));
  });
}

/** "HONTIVEROS, RISA" → "Risa Hontiveros" */
export function displayAuthorName(name: string): string {
  const [last, first] = name.split(",").map((s) => s.trim());
  const cap = (s: string) =>
    s
      .toLowerCase()
      .replace(/(^|[\s"(-])(\p{L})/gu, (_, p, c) => p + c.toUpperCase())
      .replace(/\b(Ii|Iii|Iv|Jr)\b/g, (x) => (x === "Jr" ? "Jr." : x.toUpperCase()));
  return first ? `${cap(first)} ${cap(last)}` : cap(last);
}

export type StatusTone = "law" | "moving" | "committee" | "stalled" | "unknown";

/** Bucket free-text statuses from both chambers into a few UI tones. */
export function statusTone(status: string | null | undefined): StatusTone {
  if (!status) return "unknown";
  const s = status.toLowerCase();
  if (/(republic act|approved by the president|lapsed into law|enacted)/.test(s)) return "law";
  if (/(vetoed|withdrawn|archived|consolidated|substituted)/.test(s)) return "stalled";
  if (/(committee|first reading|referred)/.test(s)) return "committee";
  if (/(second reading|third reading|approved|bicameral|conference|transmitted|enrolled)/.test(s))
    return "moving";
  return "unknown";
}
