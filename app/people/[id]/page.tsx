import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPerson, getPersonBills, personName, type OpenCongressPerson } from "@/lib/openCongress";
import { authoredBy, BATASWATCH_CONGRESS, listMeasures } from "@/lib/batasWatch";
import { summaryFromBatasWatch, summaryFromOpenCongress, type BillSummary } from "@/lib/bills";
import { ordinal } from "@/lib/format";
import { BillList } from "../../components/BillCard";
import { Avatar } from "../../components/PersonCard";
import { PageHeader, Pager } from "../../components/PageHeader";
import { LiveDataUnavailable } from "../../components/LiveDataUnavailable";

const PAGE_SIZE = 20;

async function loadPerson(id: string): Promise<OpenCongressPerson | null> {
  try {
    return await getPerson(id);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const person = await loadPerson(params.id);
  return { title: person ? personName(person) : "Lawmaker" };
}

export default async function PersonPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { congress?: string; page?: string };
}) {
  const person = await loadPerson(params.id);
  if (!person) notFound();

  const served = person.congresses_served ?? [];
  const congresses = Array.from(new Set(served.map((c) => c.congress_number))).sort((a, b) => b - a);
  const latest = served[0];
  const servesNow = congresses.includes(BATASWATCH_CONGRESS);

  // Default to the live 20th Congress list for sitting lawmakers; "all" is
  // the full Open Congress history.
  const filter = searchParams.congress ?? (servesNow ? String(BATASWATCH_CONGRESS) : "all");
  const congress = filter === "all" ? undefined : Number(filter);
  const page = Math.max(1, Number(searchParams.page) || 1);
  const bills =
    congress === BATASWATCH_CONGRESS
      ? await liveBills(person, page)
      : await getPersonBills(person.id, { congress, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
          .then((r) => ({ data: r.data.map((b) => summaryFromOpenCongress(b)), total: r.total as number | null, hasMore: r.hasMore }))
          .catch(() => null);

  return (
    <main className="px-5 pb-5 md:pt-4">
      <PageHeader title="Receipts" back="/receipts" />

      {/* Desktop: profile in a sticky left column, bills on the right. */}
      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-8">
        <div className="lg:sticky lg:top-20">
          <section className="flex items-center gap-4 rounded-[20px] bg-white p-5 shadow-sm ring-1 ring-gray-200/70 lg:flex-col lg:items-start lg:p-6">
            <Avatar person={person} size={60} />
            <div className="min-w-0">
              <h2 className="font-display text-xl font-semibold leading-tight lg:text-2xl">{personName(person)}</h2>
              {latest && (
                <p className="mt-0.5 text-sm text-gray-600">
                  {latest.position}, {latest.congress_ordinal} Congress
                </p>
              )}
              {served.length > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Served in {congresses.length} {congresses.length === 1 ? "congress" : "congresses"}
                </p>
              )}
            </div>
          </section>

          {served.length > 0 && (
            <>
              {/* Collapsed on phones to save space; always open in the desktop column. */}
              <details className="mt-3 rounded-2xl bg-white p-4 text-sm ring-1 ring-gray-200/70 lg:hidden">
                <summary className="cursor-pointer font-semibold text-gray-700">Service record</summary>
                <ServiceRecord served={served} />
              </details>
              <section className="mt-3 hidden rounded-2xl bg-white p-4 text-sm ring-1 ring-gray-200/70 lg:block">
                <h3 className="font-semibold text-gray-700">Service record</h3>
                <ServiceRecord served={served} />
              </section>
            </>
          )}
        </div>

        <section className="mt-6 lg:mt-0" aria-labelledby="authored-heading">
          <h2 id="authored-heading" className="font-display text-lg font-semibold">
            Authored bills
            {bills?.total != null && <span className="ml-2 text-sm font-normal text-gray-500">{bills.total.toLocaleString()}</span>}
          </h2>

          {congresses.length > 1 && (
            <div className="-mx-5 mt-3 flex gap-2 no-scrollbar overflow-x-auto px-5 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0" role="tablist" aria-label="Filter by congress">
              {congresses.map((n) => (
                <FilterChip
                  key={n}
                  href={`/people/${person.id}?congress=${n}`}
                  active={congress === n}
                  label={n === BATASWATCH_CONGRESS ? `${ordinal(n)} · live` : ordinal(n)}
                />
              ))}
              <FilterChip href={`/people/${person.id}?congress=all`} active={!congress} label="All history" />
            </div>
          )}

          <div className="mt-4">
            {bills === null ? (
              congress === BATASWATCH_CONGRESS ? (
                <LiveDataUnavailable what="The 20th Congress list" />
              ) : (
                <p className="text-sm text-crimson">Couldn’t reach Open Congress right now. Try again shortly.</p>
              )
            ) : bills.data.length === 0 ? (
              <p className="rounded-2xl bg-white p-5 text-center text-sm text-gray-500 ring-1 ring-gray-200">
                No authored bills on record{congress ? ` for the ${ordinal(congress)} Congress` : ""}.
              </p>
            ) : (
              <>
                <BillList bills={bills.data} />
                <p className="mt-3 text-[11px] text-gray-400">
                  {congress === BATASWATCH_CONGRESS
                    ? "Current list via BatasWatch (independent tracker)."
                    : "Via BetterGov Open Congress. Its catalogue currently runs to around September 2025."}
                </p>
                <Pager
                  basePath={`/people/${person.id}`}
                  params={{ congress: filter }}
                  page={page}
                  hasMore={bills.hasMore}
                />
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

/**
 * BatasWatch has no author filter, but its text search matches author
 * names; filter to exact authorship so shared surnames don't bleed in.
 */
async function liveBills(
  person: OpenCongressPerson,
  page: number
): Promise<{ data: BillSummary[]; total: number | null; hasMore: boolean } | null> {
  const last = person.last_name ?? "";
  const surname = last.includes("-") ? last.split("-")[0] : last;
  const givenNames = [...(person.first_name?.split(/\s+/) ?? []), ...(person.aliases ?? [])];
  try {
    const res = await listMeasures({ q: surname, sort: "latest", page });
    const mine = res.items.filter((m) => authoredBy(m, { surname, givenNames }));
    return { data: mine.map(summaryFromBatasWatch), total: null, hasMore: res.hasMore };
  } catch {
    return null;
  }
}

function ServiceRecord({ served }: { served: NonNullable<OpenCongressPerson["congresses_served"]> }) {
  return (
    <ul className="mt-3 divide-y divide-gray-100">
      {served.map((c, i) => (
        <li key={i} className="flex justify-between py-2">
          <span>{c.congress_ordinal} Congress</span>
          <span className="text-gray-500">{c.position}</span>
        </li>
      ))}
    </ul>
  );
}

function FilterChip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      scroll={false}
      className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 ring-inset ${
        active ? "bg-navy text-white ring-navy" : "bg-white text-gray-700 ring-gray-200"
      }`}
    >
      {label}
    </Link>
  );
}
