import type { Metadata } from "next";
import Link from "next/link";
import { parseBillNumber, searchBills, searchPeople } from "@/lib/openCongress";
import { getMeasureByNumber, listMeasures, toBatasWatchNumber } from "@/lib/batasWatch";
import { summaryFromBatasWatch, summaryFromOpenCongress } from "@/lib/bills";
import { BillList } from "../components/BillCard";
import { LiveDataUnavailable } from "../components/LiveDataUnavailable";
import { PersonCard } from "../components/PersonCard";
import { SearchBar } from "../components/SearchBar";
import { PageHeader, Pager } from "../components/PageHeader";

export const metadata: Metadata = { title: "Receipts" };

const PAGE_SIZE = 20;

export default async function ReceiptsPage({ searchParams }: { searchParams: { q?: string; page?: string } }) {
  const q = searchParams.q?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.page) || 1);

  return (
    <main className="px-5 pb-5">
      <PageHeader title="Receipts" />
      <p className="-mt-2 mb-4 text-sm text-gray-600">
        Every bill a lawmaker has authored, across all 13 congresses on record.
      </p>
      <SearchBar defaultValue={q} autoFocus={!q} />
      {q ? <Results q={q} page={page} /> : <Empty />}
    </main>
  );
}

async function Results({ q, page }: { q: string; page: number }) {
  const billNo = parseBillNumber(q);
  const firstPage = page === 1;

  const [people, bills, latest] = await Promise.all([
    billNo || !firstPage ? Promise.resolve([]) : searchPeople({ q, limit: 5 }).catch(() => null),
    searchBills({
      q: billNo ? String(billNo.number) : q,
      subtype: billNo?.subtype,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }).catch(() => null),
    // Open Congress lags about a year, so also check BatasWatch for newer
    // 20th Congress filings on the first page.
    !firstPage
      ? Promise.resolve([])
      : billNo
        ? getMeasureByNumber(toBatasWatchNumber(billNo.subtype, billNo.number)!)
            .then((m) => (m ? [m] : []))
            .catch(() => null)
        : listMeasures({ q, sort: "latest" })
            .then((r) => r.items)
            .catch(() => null),
  ]);

  if (people === null && bills === null && latest === null) {
    return <ErrorNote />;
  }

  const ocSummaries = (bills?.data ?? []).map((b) => summaryFromOpenCongress(b));
  const seen = new Set(ocSummaries.map((b) => b.routeId));
  const latestSummaries = (latest ?? [])
    .map(summaryFromBatasWatch)
    .filter((b) => !seen.has(b.routeId))
    .slice(0, billNo ? 1 : 5);

  const noResults = !people?.length && !ocSummaries.length && !latestSummaries.length;

  return (
    <div className="mt-6 flex flex-col gap-7">
      {latest === null && <LiveDataUnavailable what="Search of bills filed since Sept 2025" />}
      {noResults && latest !== null && (
        <p className="rounded-2xl bg-white p-5 text-center text-sm text-gray-600 ring-1 ring-gray-200">
          No matches for <span className="font-semibold">“{q}”</span>. Try a last name, a keyword from the bill title, or a bill number like “SB 1294”.
        </p>
      )}

      {people && people.length > 0 && (
        <Section id="people" title="Lawmakers">
          <ul className="flex flex-col gap-2">
            {people.map((p) => (
              <li key={p.id}>
                <PersonCard person={p} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {latestSummaries.length > 0 && (
        <Section id="latest" title={billNo ? "20th Congress" : "Latest filings · 20th Congress"}>
          <BillList bills={latestSummaries} />
        </Section>
      )}

      {ocSummaries.length > 0 && (
        <Section id="bills" title={`${billNo ? "All congresses" : "Bills"} · ${bills!.total.toLocaleString()} on record`}>
          <BillList bills={ocSummaries} />
          <Pager basePath="/receipts" params={{ q }} page={page} hasMore={bills!.hasMore} />
        </Section>
      )}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`}>
      <h2 id={`${id}-heading`} className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Empty() {
  const examples = [
    { label: "Risa Hontiveros", q: "Hontiveros" },
    { label: "Raffy Tulfo", q: "Tulfo" },
    { label: "Bills on rice", q: "rice" },
    { label: "SB 1294", q: "SB 1294" },
  ];
  return (
    <div className="mt-6">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">Try</h2>
      <ul className="grid grid-cols-2 gap-2">
        {examples.map((e) => (
          <li key={e.q}>
            <Link
              href={`/receipts?q=${encodeURIComponent(e.q)}`}
              className="block rounded-2xl bg-white p-3.5 text-sm font-medium shadow-sm ring-1 ring-gray-200/70 hover:ring-navy/30"
            >
              {e.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ErrorNote() {
  return (
    <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-crimson ring-1 ring-red-200">
      Couldn’t reach Open Congress right now. Check your connection and try again.
    </p>
  );
}
