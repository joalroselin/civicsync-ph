/**
 * Client for the BetterGov Open Congress API.
 * Source of truth for: politician profiles, congress membership,
 * and full bill authorship history across all 13 congresses.
 * Does NOT carry live bill status — that comes from BatasWatch (see batasWatch.ts).
 * Docs: https://open-congress-api.bettergov.ph (OpenAPI spec at /api/doc)
 *
 * Shapes below were verified against live responses (Sept 2026).
 */

const BASE_URL = "https://open-congress-api.bettergov.ph/api";

/** Upstream data changes slowly — cache for an hour on the server. */
const REVALIDATE_SECONDS = 3600;

export interface OpenCongressPerson {
  id: string;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  name_prefix?: string | null;
  name_suffix?: string | null;
  full_name: string | null;
  aliases?: string[] | null;
  congresses_served?: {
    congress_number: number;
    congress_ordinal: string;
    position: string;
  }[];
}

export interface OpenCongressBill {
  id: string;
  type: string;
  subtype: "HB" | "SB" | string;
  /** e.g. "SBN-01294", "HBN-04659" */
  name: string;
  bill_number: number;
  congress: number;
  title: string | null;
  long_title: string | null;
  congress_website_title: string | null;
  congress_website_abstract?: string | null;
  date_filed: string | null;
  scope: string | null;
  subjects: string[];
  authors_raw?: string | null;
  senate_website_permalink?: string | null;
  download_url_sources?: string[];
  authors?: OpenCongressPerson[];
}

export interface Page<T> {
  data: T[];
  total: number;
  hasMore: boolean;
}

/** Best available title — fields are inconsistently populated per bill. */
export function billTitle(bill: OpenCongressBill): string {
  return (
    bill.title ??
    bill.long_title ??
    bill.congress_website_title ??
    "Untitled bill"
  );
}

/** Long title when it adds something beyond the short title. */
export function billSubtitle(bill: OpenCongressBill): string | null {
  const title = billTitle(bill);
  const long = bill.long_title ?? bill.congress_website_title;
  return long && long !== title ? long : null;
}

/** "SB 1294" / "HB 4659" — compact label for UI chips. */
export function billLabel(bill: Pick<OpenCongressBill, "subtype" | "bill_number">): string {
  return `${bill.subtype} ${bill.bill_number}`;
}

export function personName(p: OpenCongressPerson): string {
  if (p.full_name) return p.full_name;
  const alias = p.aliases?.[0];
  const first = p.first_name ?? "";
  const last = p.last_name ?? "";
  const core = alias ? `${first} "${alias}" ${last}` : `${first} ${last}`;
  return [p.name_prefix, core.trim(), p.name_suffix].filter(Boolean).join(" ");
}

/** Short display name, e.g. "Risa Hontiveros-Baraquel". */
export function personShortName(p: OpenCongressPerson): string {
  const first = p.aliases?.[0] ?? p.first_name?.split(" ")[0] ?? "";
  return `${first} ${p.last_name ?? ""}`.trim();
}

export function personInitials(p: OpenCongressPerson): string {
  return `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase() || "?";
}

async function get<T>(path: string, params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams(
    Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)])
  );
  const res = await fetch(`${BASE_URL}${path}?${qs}`, {
    next: { revalidate: REVALIDATE_SECONDS },
  });
  if (!res.ok) throw new Error(`Open Congress ${path} failed: ${res.status}`);
  const json = await res.json();
  return json as { data: T; pagination?: { total: number; has_more: boolean } };
}

function toPage<T>(json: { data: T[]; pagination?: { total: number; has_more: boolean } }): Page<T> {
  return {
    data: json.data ?? [],
    total: json.pagination?.total ?? json.data?.length ?? 0,
    hasMore: json.pagination?.has_more ?? false,
  };
}

export async function searchPeople(params: {
  q: string;
  type?: "senator" | "representative";
  congress?: number;
  limit?: number;
}): Promise<OpenCongressPerson[]> {
  const json = await get<OpenCongressPerson[]>("/search/people", params);
  // Upstream has duplicate records for some lawmakers (e.g. one per chamber
  // served); keep the first, which carries the fuller profile.
  const seen = new Set<string>();
  return (json.data ?? []).filter((p) => {
    const key = [p.first_name, p.last_name, p.name_suffix].join("|").toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function searchBills(params: {
  q: string;
  congress?: number;
  subtype?: "SB" | "HB";
  limit?: number;
  offset?: number;
}): Promise<Page<OpenCongressBill>> {
  return toPage(await get<OpenCongressBill[]>("/search/documents", params));
}

/**
 * Recognise bill-number queries like "SB 1294", "SBN-01294", "hb4659".
 * Full-text search doesn't match these directly — it needs the bare
 * number plus a subtype filter.
 */
export function parseBillNumber(q: string): { subtype: "SB" | "HB"; number: number } | null {
  const m = q.trim().match(/^(s|h)(?:b|bn|\.b\.)?[\s.-]*(?:no\.?\s*)?0*(\d{1,5})$/i);
  if (!m) return null;
  return { subtype: m[1].toUpperCase() === "S" ? "SB" : "HB", number: Number(m[2]) };
}

export async function getPerson(id: string): Promise<OpenCongressPerson> {
  const json = await get<OpenCongressPerson>(`/people/${id}`, {
    include_congresses: "true",
  });
  return json.data;
}

export async function getPersonBills(
  personId: string,
  params: { congress?: number; limit?: number; offset?: number } = {}
): Promise<Page<OpenCongressBill>> {
  return toPage(await get<OpenCongressBill[]>(`/people/${personId}/documents`, params));
}

export async function getBill(id: string): Promise<OpenCongressBill> {
  const json = await get<OpenCongressBill>(`/documents/${encodeURIComponent(id)}`);
  if (!json.data) throw new Error(`Open Congress bill ${id} not found`);
  return json.data;
}

export const CURRENT_CONGRESS = 20;
