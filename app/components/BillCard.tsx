import Link from "next/link";
import { authorLine, authorRole, type BillSummary } from "@/lib/bills";
import { StatusBadge } from "./StatusBadge";
import { WatchButton } from "./WatchButton";
import { formatDate, ordinal, toTitleCase } from "@/lib/format";
import { Highlight } from "./Highlight";

export function BillCard({ bill, hideAuthor = false, highlight }: { bill: BillSummary; hideAuthor?: boolean; highlight?: string[] }) {
  const title = toTitleCase(bill.title);
  const byline = hideAuthor ? null : authorLine(bill);
  return (
    <Link
      href={`/bills/${bill.routeId}`}
      className="flex items-start gap-3 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-gray-200/70 transition hover:ring-navy-ink/30"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span className="rounded-md bg-navy-ink/10 px-1.5 py-0.5 font-semibold text-navy-ink">{bill.label}</span>
          <span>
            {ordinal(bill.congress)} Congress{bill.dateFiled && ` · Filed ${formatDate(bill.dateFiled)}`}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-3 text-[15px] font-medium leading-snug text-gray-900">
          <Highlight text={title} terms={highlight} />
        </p>
        {byline && <AuthorByline text={byline} role={authorRole(bill.label)} />}
        {bill.status !== undefined && (
          <div className="mt-2">
            <StatusBadge status={bill.status} />
          </div>
        )}
      </div>
      <WatchButton
        variant="icon"
        bill={{ id: bill.routeId, label: bill.label, title, congress: bill.congress, status: bill.status ?? null, authorLine: byline ?? undefined }}
      />
    </Link>
  );
}

/** "Sen. Risa Hontiveros +2", with the full role for screen readers. */
export function AuthorByline({ text, role }: { text: string; role: string }) {
  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-600" title={role}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-gray-500" aria-hidden>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21a8 8 0 0 1 16 0" strokeLinecap="round" />
      </svg>
      <span className="truncate">
        <span className="sr-only">{role}: </span>
        {text}
      </span>
    </p>
  );
}

export function BillList({ bills, hideAuthor = false, highlight }: { bills: BillSummary[]; hideAuthor?: boolean; highlight?: string[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {bills.map((b) => (
        <li key={b.routeId}>
          <BillCard bill={b} hideAuthor={hideAuthor} highlight={highlight} />
        </li>
      ))}
    </ul>
  );
}

/** Compact row for grouped lists (e.g. one panel per chamber on the home page). */
export function BillRow({ bill, movedOn, summary, highlight }: { bill: BillSummary; movedOn?: string; summary?: string | null; highlight?: string[] }) {
  const title = toTitleCase(bill.title);
  const byline = authorLine(bill);
  return (
    <Link href={`/bills/${bill.routeId}`} className="flex items-start gap-3 px-4 py-3.5 transition hover:bg-gray-50">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span className="font-semibold text-navy-ink">{bill.label}</span>
          {movedOn ? <span>· Moved {formatDate(movedOn)}</span> : bill.dateFiled && <span>· Filed {formatDate(bill.dateFiled)}</span>}
        </div>
        <p className="mt-1 line-clamp-2 text-[15px] font-medium leading-snug text-gray-900">
          <Highlight text={title} terms={highlight} />
        </p>
        {summary && <p className="mt-1 line-clamp-2 text-sm leading-snug text-gray-600">{summary}</p>}
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {bill.status !== undefined && <StatusBadge status={bill.status} />}
          {byline && <span className="truncate text-xs text-gray-500">{byline}</span>}
        </div>
      </div>
      <WatchButton
        variant="icon"
        bill={{ id: bill.routeId, label: bill.label, title, congress: bill.congress, status: bill.status ?? null, authorLine: byline ?? undefined }}
      />
    </Link>
  );
}
