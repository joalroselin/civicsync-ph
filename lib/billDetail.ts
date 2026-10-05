import "server-only";
import { getBillDetail, LiveSourceUnavailableError, parseLaw, type BillDetail } from "./bills";
import { fromBatasWatchNumber, toBatasWatchNumber } from "./batasWatch";
import { parseBillNumber } from "./openCongress";
import { indexDate, indexedBill } from "./billIndex";

/**
 * getBillDetail, but if the live tracker is down, a 20th Congress bill is
 * built from last night's copy (CS-903) instead of showing "unavailable".
 */
export async function getBillDetailWithFallback(id: string): Promise<BillDetail> {
  try {
    return await getBillDetail(id);
  } catch (err) {
    if (!(err instanceof LiveSourceUnavailableError)) throw err;
    const parsed = fromBatasWatchNumber(id) ?? parseBillNumber(id);
    const snap = parsed ? indexedBill(toBatasWatchNumber(parsed.subtype, parsed.number)!) : null;
    if (!snap || !parsed) throw err;
    return {
      id: snap.n,
      label: `${parsed.subtype} ${parsed.number}`,
      billNumber: snap.n,
      chamber: snap.c === "s" ? "Senate" : "House",
      congress: 20,
      title: snap.t || "Untitled bill",
      subtitle: null,
      dateFiled: snap.f,
      scope: null,
      subjects: [],
      authors: [],
      authorNames: snap.a ? [snap.a + (snap.k > 1 ? ` and ${snap.k - 1} more` : "")] : [],
      authorIds: [],
      sourceUrls: snap.o ? [{ label: snap.c === "s" ? "Senate record" : "House record", url: snap.o }] : [],
      status: snap.s || null,
      law: parseLaw(snap.s),
      committee: null,
      secondaryCommittees: [],
      analysis: null,
      statusSource: "snapshot",
      statusAsOf: indexDate(),
      inOpenCongress: false,
    };
  }
}

