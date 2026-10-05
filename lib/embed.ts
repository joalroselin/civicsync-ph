import { type BillDetail } from "./bills";
import { getBillDetailWithFallback } from "./billDetail";
import { personShortName } from "./openCongress";
import { statusTone, type StatusTone } from "./batasWatch";
import { toTitleCase } from "./format";

/** Shared data for the embeddable bill widget and badge. */
export interface EmbedBill {
  id: string;
  label: string;
  title: string;
  chamber: BillDetail["chamber"];
  congress: number;
  status: string;
  tone: StatusTone;
  byline: string | null;
}

export const TONE_COLORS: Record<StatusTone, { bg: string; fg: string; dot: string }> = {
  law: { bg: "#ECFDF5", fg: "#065F46", dot: "#10B981" },
  moving: { bg: "#EFF6FF", fg: "#1E3A8A", dot: "#3B82F6" },
  committee: { bg: "#FFFBEB", fg: "#92400E", dot: "#F59E0B" },
  stalled: { bg: "#FEF2F2", fg: "#991B1B", dot: "#EF4444" },
  unknown: { bg: "#F3F4F6", fg: "#4B5563", dot: "#9CA3AF" },
};

export async function loadEmbedBill(id: string): Promise<EmbedBill | null> {
  const bill = await getBillDetailWithFallback(id).catch(() => null);
  if (!bill) return null;
  const names = bill.authors.length ? bill.authors.map(personShortName) : bill.authorNames;
  const prefix = bill.chamber === "Senate" ? "Sen." : "Rep.";
  const raw = bill.status ?? "See official record";
  // Same clean-up as StatusBadge: sentence-case Senate caps, drop House "(Filed last …)".
  const status = (raw === raw.toUpperCase() ? raw.charAt(0) + raw.slice(1).toLowerCase() : raw).replace(/\s*\(.*\)\s*$/, "");
  return {
    id: bill.id,
    label: bill.label,
    title: toTitleCase(bill.title),
    chamber: bill.chamber,
    congress: bill.congress,
    status,
    tone: statusTone(bill.status),
    byline: names.length ? `${prefix} ${names[0]}${names.length > 1 ? ` +${names.length - 1}` : ""}` : null,
  };
}

export const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Cache at the edge for 30 minutes, matching how often status is refreshed. */
export const EMBED_CACHE = "public, s-maxage=1800, stale-while-revalidate=86400";
