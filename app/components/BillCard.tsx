import Link from "next/link";
import type { BillSummary } from "@/lib/bills";
import { StatusBadge } from "./StatusBadge";
import { WatchButton } from "./WatchButton";
import { formatDate, ordinal, toTitleCase } from "@/lib/format";

export function BillCard({ bill }: { bill: BillSummary }) {
  const title = toTitleCase(bill.title);
  return (
    <Link
      href={`/bills/${bill.routeId}`}
      className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70 transition hover:ring-navy/30"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
          <span className="rounded-md bg-navy/10 px-1.5 py-0.5 font-semibold text-navy">{bill.label}</span>
          <span>
            {ordinal(bill.congress)} Congress{bill.dateFiled && ` · Filed ${formatDate(bill.dateFiled)}`}
          </span>
        </div>
        <p className="mt-1.5 line-clamp-3 text-[15px] font-medium leading-snug text-gray-900">{title}</p>
        {bill.status !== undefined && (
          <div className="mt-2">
            <StatusBadge status={bill.status} />
          </div>
        )}
      </div>
      <WatchButton
        variant="icon"
        bill={{ id: bill.routeId, label: bill.label, title, congress: bill.congress, status: bill.status ?? null }}
      />
    </Link>
  );
}

export function BillList({ bills }: { bills: BillSummary[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {bills.map((b) => (
        <li key={b.routeId}>
          <BillCard bill={b} />
        </li>
      ))}
    </ul>
  );
}
