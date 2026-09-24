import {
  getBill,
  billTitle,
  billSubtitle,
  billLabel,
  searchBills,
  parseBillNumber,
  type OpenCongressBill,
  type OpenCongressPerson,
} from "@/lib/openCongress";
import {
  BATASWATCH_CONGRESS,
  displayAuthorName,
  fromBatasWatchNumber,
  getMeasureByNumber,
  toBatasWatchNumber,
  type BatasWatchMeasure,
} from "@/lib/batasWatch";

/**
 * Open Congress's catalogue currently stops around Sept 2025, while
 * BatasWatch tracks the 20th Congress up to the present. So a bill can
 * exist in either source or both:
 *
 * - 20th Congress bills are addressed by their BatasWatch number
 *   ("SBN-1294", "HB04659") so the same bill has one URL and one
 *   Watchlist entry whichever source surfaced it.
 * - Earlier congresses are addressed by their Open Congress ID.
 */
export function billRouteId(bill: Pick<OpenCongressBill, "id" | "subtype" | "bill_number" | "congress">): string {
  if (bill.congress === BATASWATCH_CONGRESS) {
    const n = toBatasWatchNumber(bill.subtype, bill.bill_number);
    if (n) return n;
  }
  return bill.id;
}

/** BatasWatch was unreachable and Open Congress doesn't have the bill — it may still exist. */
export class LiveSourceUnavailableError extends Error {}

const OPEN_CONGRESS_ID = /^[0-9A-HJKMNP-TV-Z]{26}$/;

/** What a list row needs, whichever source it came from. */
export interface BillSummary {
  routeId: string;
  label: string;
  congress: number;
  title: string;
  dateFiled: string | null;
  /** undefined → don't show a status badge (e.g. search rows without a lookup) */
  status?: string | null;
}

export function summaryFromOpenCongress(bill: OpenCongressBill, status?: string | null): BillSummary {
  return {
    routeId: billRouteId(bill),
    label: billLabel(bill),
    congress: bill.congress,
    title: billTitle(bill),
    dateFiled: bill.date_filed,
    status,
  };
}

export function summaryFromBatasWatch(m: BatasWatchMeasure): BillSummary {
  const parsed = fromBatasWatchNumber(m.number);
  return {
    routeId: m.number,
    label: parsed ? `${parsed.subtype} ${parsed.number}` : m.number,
    congress: m.congress,
    title: m.title ?? m.longTitle ?? "Untitled bill",
    dateFiled: m.filedAt,
    status: statusText(m),
  };
}

/** Newly filed Senate bills have no status yet — say so rather than "unavailable". */
function statusText(m: BatasWatchMeasure): string {
  return m.status ?? "Filed";
}

export interface BillDetail {
  id: string;
  label: string;
  billNumber: string;
  chamber: "Senate" | "House";
  congress: number;
  title: string;
  subtitle: string | null;
  dateFiled: string | null;
  scope: string | null;
  subjects: string[];
  /** Linked Open Congress profiles, when Open Congress has the bill. */
  authors: OpenCongressPerson[];
  /** Plain names, used when there are no linked profiles. */
  authorNames: string[];
  sourceUrls: { label: string; url: string }[];
  // BatasWatch — null when unavailable or outside the 20th Congress
  status: string | null;
  committee: string | null;
  secondaryCommittees: string[];
  analysis: BatasWatchMeasure["analysis"];
  statusSource: "batasWatch" | null;
  inOpenCongress: boolean;
}

/**
 * Merges the two data sources per the v1.1 roadmap decision:
 * - Open Congress → authorship, historical record (source of truth)
 * - BatasWatch    → live status, committee; also the only record of
 *                   20th Congress bills filed after Open Congress's cut-off
 */
export async function getBillDetail(id: string): Promise<BillDetail> {
  let oc: OpenCongressBill | null = null;
  let bw: BatasWatchMeasure | null = null;

  if (OPEN_CONGRESS_ID.test(id)) {
    oc = await getBill(id);
    const bwNumber = oc.congress === BATASWATCH_CONGRESS ? toBatasWatchNumber(oc.subtype, oc.bill_number) : null;
    // Status must never fail the whole request.
    if (bwNumber) bw = await getMeasureByNumber(bwNumber).catch(() => null);
  } else {
    const parsed = fromBatasWatchNumber(id) ?? parseBillNumber(id);
    if (!parsed) throw new Error(`Unrecognised bill id: ${id}`);
    const bwNumber = toBatasWatchNumber(parsed.subtype, parsed.number)!;
    let bwFailed = false;
    [bw, oc] = await Promise.all([
      getMeasureByNumber(bwNumber).catch(() => {
        bwFailed = true;
        return null;
      }),
      findOpenCongressBill(parsed.subtype, parsed.number, BATASWATCH_CONGRESS).catch(() => null),
    ]);
    if (!oc && !bw && bwFailed) throw new LiveSourceUnavailableError(`BatasWatch unreachable for ${id}`);
  }

  if (!oc && !bw) throw new Error(`Bill ${id} not found in either source`);
  return merge(oc, bw);
}

async function findOpenCongressBill(subtype: "SB" | "HB", number: number, congress: number) {
  const page = await searchBills({ q: String(number), subtype, congress, limit: 5 });
  const hit = page.data.find((b) => b.bill_number === number && b.congress === congress);
  // Search results omit some fields (e.g. download links) — fetch the full record.
  return hit ? getBill(hit.id) : null;
}

function merge(oc: OpenCongressBill | null, bw: BatasWatchMeasure | null): BillDetail {
  const parsed = oc ? { subtype: oc.subtype, number: oc.bill_number } : fromBatasWatchNumber(bw!.number)!;
  const congress = oc?.congress ?? bw!.congress;

  const sourceUrls: { label: string; url: string }[] = [];
  if (oc?.senate_website_permalink) sourceUrls.push({ label: "Senate record", url: oc.senate_website_permalink });
  for (const v of bw?.documentVersions ?? []) sourceUrls.push({ label: v.label, url: v.url });
  if (!bw?.documentVersions?.length)
    for (const url of oc?.download_url_sources ?? []) sourceUrls.push({ label: "Bill text (PDF)", url });
  if (bw?.officialRecordUrl && !oc?.senate_website_permalink)
    sourceUrls.push({
      label: parsed.subtype === "SB" ? "Senate record" : "House record",
      url: bw.officialRecordUrl,
    });

  const ocTitle = oc ? billTitle(oc) : null;
  const title = oc && ocTitle !== "Untitled bill" ? ocTitle! : bw?.title ?? bw?.longTitle ?? "Untitled bill";
  const subtitle = oc ? billSubtitle(oc) : bw?.longTitle && bw.longTitle !== title ? bw.longTitle : null;

  return {
    id: congress === BATASWATCH_CONGRESS && bw ? bw.number : oc ? billRouteId(oc) : bw!.number,
    label: `${parsed.subtype} ${parsed.number}`,
    billNumber: bw?.number ?? oc!.name,
    chamber: parsed.subtype === "SB" ? "Senate" : "House",
    congress,
    title,
    subtitle,
    dateFiled: oc?.date_filed ?? bw?.filedAt ?? null,
    scope: oc?.scope ?? null,
    subjects: oc?.subjects ?? [],
    authors: oc?.authors ?? [],
    authorNames: bw?.authorCredits?.length
      ? bw.authorCredits.map((a) => displayAuthorName(a.name))
      : oc?.authors_raw
        ? [oc.authors_raw]
        : [],
    sourceUrls,
    status: bw ? statusText(bw) : null,
    committee: bw?.primaryCommittee ?? null,
    secondaryCommittees: bw?.secondaryCommittees ?? [],
    analysis: bw?.analysis ?? null,
    statusSource: bw ? "batasWatch" : null,
    inOpenCongress: Boolean(oc),
  };
}
