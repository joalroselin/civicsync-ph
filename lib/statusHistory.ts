import changesFile from "@/data/status/changes.json";
import { fromBatasWatchNumber } from "./batasWatch";
import type { BillSummary } from "./bills";

/**
 * Status changes recorded by the nightly snapshot (CS-119): every bill's
 * status is saved daily and compared with the day before. Covers both
 * chambers, from `trackingSince` onward (last 120 days kept here; older
 * months are in data/status/archive/).
 */
export interface StatusChange {
  date: string; // YYYY-MM-DD (Manila)
  number: string; // "SBN-1294" / "HB04659"
  chamber: "senate" | "house";
  title: string;
  from: string;
  to: string;
}

const file = changesFile as unknown as { since: string; updated?: string; changes: StatusChange[] };
export const trackingSince = file.since;
export const allRecentChanges: StatusChange[] = file.changes;

/** A step forward (not just a re-referral or formatting change). */
const PROGRESSED = /approved|reading|business for|agreed|transmitted|received by|enrolled|ratified|republic act|lapsed|special order|sponsorship|bicameral|conference|with rules/i;
export const isProgress = (c: StatusChange) => PROGRESSED.test(c.to);

export function changesSince(days: number, opts: { chamber?: "senate" | "house"; progressOnly?: boolean } = {}): StatusChange[] {
  const cutoff = new Date(Date.now() - days * 864e5).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
  return allRecentChanges.filter(
    (c) => c.date >= cutoff && (!opts.chamber || c.chamber === opts.chamber) && (!opts.progressOnly || isProgress(c))
  );
}

export function billHistory(number: string): StatusChange[] {
  return allRecentChanges.filter((c) => c.number === number);
}

/** A change as a list row (title and new status; no authors in the snapshot). */
export function changeToSummary(c: StatusChange): BillSummary & { chamber: "senate" | "house"; movedOn: string } {
  const p = fromBatasWatchNumber(c.number);
  return {
    routeId: c.number,
    label: p ? `${p.subtype} ${p.number}` : c.number,
    congress: 20,
    title: c.title || "Untitled bill",
    dateFiled: null,
    status: c.to,
    authors: [],
    chamber: c.chamber,
    movedOn: c.date,
  };
}
