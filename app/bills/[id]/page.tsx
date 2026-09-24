import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBillDetail, LiveSourceUnavailableError, type BillDetail } from "@/lib/bills";
import { BATASWATCH_CONGRESS } from "@/lib/batasWatch";
import { formatDate, ordinal, toTitleCase } from "@/lib/format";
import { PageHeader } from "../../components/PageHeader";
import { PersonCard } from "../../components/PersonCard";
import { StatusBadge } from "../../components/StatusBadge";
import { WatchButton } from "../../components/WatchButton";
import { ShareButton } from "../../components/ShareButton";
import { SearchLink } from "../../components/SearchNavigation";
import { LiveDataUnavailable } from "../../components/LiveDataUnavailable";

async function load(id: string): Promise<BillDetail | "unavailable" | null> {
  try {
    return await getBillDetail(id);
  } catch (err) {
    return err instanceof LiveSourceUnavailableError ? "unavailable" : null;
  }
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const bill = await load(params.id);
  if (!bill || bill === "unavailable") return { title: "Bill" };
  return { title: `${bill.label}: ${toTitleCase(bill.title)}`, description: bill.analysis?.overview ?? bill.subtitle ?? undefined };
}

export default async function BillPage({ params }: { params: { id: string } }) {
  const bill = await load(params.id);
  if (!bill) notFound();
  if (bill === "unavailable") {
    return (
      <main className="px-5 pb-5">
        <PageHeader title="Bill" back="/receipts" />
        <LiveDataUnavailable what="This bill" />
      </main>
    );
  }

  const title = toTitleCase(bill.title);
  const isCurrent = bill.congress === BATASWATCH_CONGRESS;

  return (
    <main className="px-5 pb-5 md:pt-4">
      <PageHeader title={bill.label} back="/receipts">
        <ShareButton title={`${bill.label}: ${title}`} />
      </PageHeader>

      {/*
        Phones: one column in DOM order (title, watch, status, summary, …).
        Wide screens (xl, 1280px+): title + details on the left; watch/status/
        authors in a sticky side panel. Below that the sidebar leaves too
        little room for two columns, so it stays single-column.
      */}
      <div className="flex flex-col xl:grid xl:grid-cols-[minmax(0,1fr)_340px] xl:grid-rows-[auto_1fr] xl:gap-x-8">
        <div className="xl:col-start-1 xl:row-start-1">
          <section className="rounded-[20px] bg-navy p-5 text-white shadow-md md:p-8">
            <div className="flex flex-wrap gap-x-2 text-xs font-medium text-indigo-200">
              <span>{bill.chamber}</span>
              <span>·</span>
              <span>{ordinal(bill.congress)} Congress</span>
              {bill.dateFiled && (
                <>
                  <span>·</span>
                  <span>Filed {formatDate(bill.dateFiled)}</span>
                </>
              )}
            </div>
            <h2 className="mt-2 font-display text-[22px] font-semibold leading-tight md:text-3xl">{title}</h2>
            {bill.subtitle && <p className="mt-2 text-sm leading-relaxed text-indigo-100/90 md:text-base">{toTitleCase(bill.subtitle)}</p>}
          </section>
        </div>

        <aside className="xl:sticky xl:top-20 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start">
          <div className="mt-4 xl:mt-0">
            <WatchButton bill={{ id: bill.id, label: bill.label, title, congress: bill.congress, status: bill.status }} />
          </div>
          <Card title="Status">
            {bill.statusSource ? (
              <>
                <StatusBadge status={bill.status} size="md" />
                {bill.committee && (
                  <dl className="mt-3 text-sm">
                    <dt className="text-xs text-gray-500">Primary committee</dt>
                    <dd className="font-medium">{toTitleCase(bill.committee)}</dd>
                    {bill.secondaryCommittees.length > 0 && (
                      <>
                        <dt className="mt-2 text-xs text-gray-500">Secondary</dt>
                        <dd>{bill.secondaryCommittees.map(toTitleCase).join(", ")}</dd>
                      </>
                    )}
                  </dl>
                )}
                <p className="mt-3 text-[11px] text-gray-400">Status via BatasWatch (independent source)</p>
              </>
            ) : (
              <p className="text-sm text-gray-500">
                {isCurrent
                  ? "Live status is temporarily unavailable. Check the official record below."
                  : `Live status tracking covers the ${ordinal(BATASWATCH_CONGRESS)} Congress only. See the official record below for this bill’s final outcome.`}
              </p>
            )}
          </Card>
          <div className="hidden xl:block">
            <Card title={Math.max(bill.authors.length, bill.authorNames.length) === 1 ? "Author" : "Authors"}>
              {bill.authors.length > 0 ? (
                <ul className="-mx-1 flex flex-col gap-2">
                  {bill.authors.map((a) => (
                    <li key={a.id}>
                      <PersonCard person={a} />
                    </li>
                  ))}
                </ul>
              ) : bill.authorNames.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {bill.authorNames.map((name) => (
                    <li key={name}>
                      <SearchLink q={surnameOf(name)} className="flex items-center justify-between py-2.5 text-sm font-medium">
                        {name}
                        <span className="text-xs text-navy">Receipts →</span>
                      </SearchLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No authors on record yet.</p>
              )}
            </Card>
          </div>
        </aside>

        <div className="xl:col-start-1 xl:row-start-2">
          {bill.analysis?.overview && (
            <Card title="In plain language">
              <p className="text-[15px] leading-relaxed">{bill.analysis.overview}</p>
              {bill.analysis.policyAreas && bill.analysis.policyAreas.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {bill.analysis.policyAreas.map((a) => (
                    <span key={a} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      {a}
                    </span>
                  ))}
                </div>
              )}
              <p className="mt-3 text-[11px] text-gray-400">
                Automated summary by BatasWatch. It may miss nuance — read the bill text before citing it.
              </p>
            </Card>
          )}
          <div className="xl:hidden">
            <Card title={Math.max(bill.authors.length, bill.authorNames.length) === 1 ? "Author" : "Authors"}>
              {bill.authors.length > 0 ? (
                <ul className="-mx-1 flex flex-col gap-2">
                  {bill.authors.map((a) => (
                    <li key={a.id}>
                      <PersonCard person={a} />
                    </li>
                  ))}
                </ul>
              ) : bill.authorNames.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {bill.authorNames.map((name) => (
                    <li key={name}>
                      <SearchLink q={surnameOf(name)} className="flex items-center justify-between py-2.5 text-sm font-medium">
                        {name}
                        <span className="text-xs text-navy">Receipts →</span>
                      </SearchLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">No authors on record yet.</p>
              )}
            </Card>
          </div>
          {bill.subjects.length > 0 && (
            <Card title="Subjects">
              <div className="flex flex-wrap gap-1.5">
                {bill.subjects.map((s) => (
                  <span key={s} className="rounded-full bg-navy/5 px-2.5 py-1 text-xs text-navy">
                    {s}
                  </span>
                ))}
              </div>
            </Card>
          )}
          {bill.sourceUrls.length > 0 && (
            <Card title="Official sources">
              <ul className="divide-y divide-gray-100">
                {bill.sourceUrls.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 py-2.5 text-sm font-medium text-navy">
                      <span className="truncate">{s.label}</span>
                      <span aria-hidden>↗</span>
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <p className="mt-6 text-center text-[11px] text-gray-400">
        {bill.billNumber} · Sources:{" "}
        {[bill.inOpenCongress && "BetterGov Open Congress", bill.statusSource && "BatasWatch"].filter(Boolean).join(", ")}
      </p>
    </main>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      {children}
    </section>
  );
}

/** "Erwin Tulfo" → "Tulfo"; "Vicente Sotto III" → "Sotto" */
function surnameOf(name: string) {
  const parts = name.replace(/"[^"]*"/g, "").trim().split(/\s+/).filter((p) => !/^(Jr\.?|Sr\.?|I{1,3}|IV)$/.test(p));
  return parts[parts.length - 1] ?? name;
}
