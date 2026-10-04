import type { Metadata } from "next";
import Link from "next/link";
import { allLaws, irrStatus, lawsUpdated } from "@/lib/laws";
import { formatDate, toTitleCase } from "@/lib/format";
import { PageHeader } from "../components/PageHeader";
import { IrrStatusBadge } from "../components/IrrStatus";

export const metadata: Metadata = {
  title: "Laws and their implementing rules",
  description: "Every Republic Act from the 20th Congress of the Philippines: when it became law, who must write its implementing rules (IRR), and by when.",
};

const billLabel = (n: string) => n.replace(/^SBN-/, "SB ").replace(/^HB0*/, "HB ");

export default function LawsPage() {
  const rows = allLaws.map((l) => ({ law: l, ...irrStatus(l) }));
  const withDeadline = rows.filter((r) => r.due).length;
  const overdue = rows.filter((r) => r.state === "overdue").length;

  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="Laws" />
      <div className="max-w-4xl">
        <p className="max-w-3xl text-[15px] leading-relaxed text-gray-700">
          Every bill from the 20th Congress that became a Republic Act. Most laws need <strong>implementing rules and regulations (IRR)</strong>: the
          detailed rules an agency writes so the law can actually be carried out. The law itself usually says which agency writes them, and by when.
        </p>
        <dl className="mt-4 grid grid-cols-3 gap-2 sm:max-w-md">
          {[
            [rows.length, "laws so far"],
            [withDeadline, "set an IRR deadline"],
            [overdue, "past due (estimate)"],
          ].map(([n, l]) => (
            <div key={l as string} className="rounded-2xl bg-surface px-2 py-3 text-center ring-1 ring-gray-200/70">
              <dt className="sr-only">{l}</dt>
              <dd>
                <span className="block font-display text-xl font-semibold text-navy-ink">{n}</span>
                <span className="block text-[11px] leading-tight text-gray-500">{l}</span>
              </dd>
            </div>
          ))}
        </dl>

        {rows.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-surface p-5 text-sm text-gray-600 ring-1 ring-gray-200/70">
            We’re reading the laws now. This list fills in after the next nightly update.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-gray-100 overflow-hidden rounded-2xl bg-surface ring-1 ring-gray-200/70">
            {rows.map(({ law, state, due }) => (
              <li key={law.ra} className="px-4 py-3.5">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                  <span className="font-semibold text-emerald-700">RA {law.ra}</span>
                  <span>
                    · {law.how === "lapsed" ? "Lapsed into law" : "Signed"} {law.date ? formatDate(law.date) : ""}
                  </span>
                  <Link href={`/bills/${law.bill}`} className="font-semibold text-navy-ink hover:underline">
                    {billLabel(law.bill)}
                  </Link>
                </div>
                <Link href={`/bills/${law.bill}`} className="mt-1 line-clamp-2 block text-[15px] font-medium leading-snug text-gray-900 hover:text-navy-ink">
                  {toTitleCase(law.title)}
                </Link>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-600">
                  <IrrStatusBadge state={state} />
                  {law.irr?.agency && <span>IRR by {law.irr.agency}</span>}
                  {due && <span>due around {formatDate(due)}</span>}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 max-w-3xl space-y-1 text-[11px] text-gray-500">
          <p>
            Agency and deadline are read automatically from each scanned law, so check the law’s text for exact wording. Due dates are estimates: we
            count from when it became law plus its effectivity period, because we don’t track publication dates yet.
          </p>
          <p>
            “Past due” means the estimated date has passed. We don’t yet know which IRRs have been published. If you do, send us the link from the
            law’s page. Updated {formatDate(lawsUpdated.slice(0, 10))}.
          </p>
        </div>
      </div>
    </main>
  );
}
