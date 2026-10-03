import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBillDetail, LiveSourceUnavailableError, type BillDetail } from "@/lib/bills";
import { getSiteSettings } from "@/lib/content";
import { BATASWATCH_CONGRESS } from "@/lib/batasWatch";
import { formatDate, ordinal, toTitleCase } from "@/lib/format";
import { PageHeader } from "../../components/PageHeader";
import { PersonCard } from "../../components/PersonCard";
import { StatusBadge } from "../../components/StatusBadge";
import { StatusHelp } from "../../components/StatusHelp";
import { WatchButton } from "../../components/WatchButton";
import { ShareButton } from "../../components/ShareButton";
import { SearchLink } from "../../components/SearchNavigation";
import { EmailAction } from "../../components/EmailAction";
import { LiveDataUnavailable } from "../../components/LiveDataUnavailable";
import { BillTools } from "../../components/BillTools";
import { SITE_URL } from "@/lib/site";
import { personName } from "@/lib/openCongress";

async function load(id: string): Promise<BillDetail | "unavailable" | null> {
  try {
    return await getBillDetail(id);
  } catch (err) {
    return err instanceof LiveSourceUnavailableError ? "unavailable" : null;
  }
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const params = await props.params;
  const bill = await load(params.id);
  if (!bill || bill === "unavailable") return { title: "Bill" };
  return { title: `${bill.label}: ${toTitleCase(bill.title)}`, description: bill.analysis?.overview ?? bill.subtitle ?? undefined };
}

export default async function BillPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
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
  // Senate bills are filed by senators, House bills by representatives.
  const role = bill.chamber === "Senate" ? "Senator" : "Representative";
  const authorCount = Math.max(bill.authors.length, bill.authorNames.length);
  const { contactEmail } = await getSiteSettings();
  const reportSubject = `Data correction: ${bill.label} (CivicSync PH)`;
  const reportBody = `Bill: ${bill.label}, ${ordinal(bill.congress)} Congress\nPage: https://civicsync-ph-gamma.vercel.app/bills/${bill.id}\n\nWhat looks wrong (status, author, title, committee…):\n\nWhat it should say:\n\nWhere you saw the correct information (link to the official Senate or House record, if you have one):\n`;

  // schema.org Legislation, so search engines understand what this page is.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Legislation",
    name: `${bill.label}: ${title}`,
    legislationIdentifier: bill.billNumber,
    legislationJurisdiction: "PH",
    ...(bill.dateFiled && { dateCreated: bill.dateFiled }),
    ...(bill.analysis?.overview && { abstract: bill.analysis.overview }),
    author: (bill.authors.length ? bill.authors.map(personName) : bill.authorNames).map((name) => ({ "@type": "Person", name })),
    url: `${SITE_URL}/bills/${bill.id}`,
    ...(bill.sourceUrls[0] && { sameAs: bill.sourceUrls.map((s) => s.url) }),
  };

  return (
    <main className="px-5 pb-5 md:pt-4">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
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
                <StatusHelp status={bill.status} />
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
            <Card title={authorCount === 1 ? `Author · ${role}` : `Authors · ${role}s`}>
              {bill.authors.length > 0 ? (
                <ul className="-mx-1 flex flex-col gap-2">
                  {bill.authors.map((a) => (
                    <li key={a.id}>
                      <PersonCard person={a} role={role} />
                    </li>
                  ))}
                </ul>
              ) : bill.authorNames.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {bill.authorNames.map((name) => (
                    <li key={name}>
                      <SearchLink q={surnameOf(name)} className="flex items-center justify-between py-2.5 text-sm font-medium">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[11px] font-semibold text-navy">{role}</span>
                          <span className="truncate">{name}</span>
                        </span>
                        <span className="shrink-0 text-xs text-navy">Receipts →</span>
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
            <Card title={authorCount === 1 ? `Author · ${role}` : `Authors · ${role}s`}>
              {bill.authors.length > 0 ? (
                <ul className="-mx-1 flex flex-col gap-2">
                  {bill.authors.map((a) => (
                    <li key={a.id}>
                      <PersonCard person={a} role={role} />
                    </li>
                  ))}
                </ul>
              ) : bill.authorNames.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                  {bill.authorNames.map((name) => (
                    <li key={name}>
                      <SearchLink q={surnameOf(name)} className="flex items-center justify-between py-2.5 text-sm font-medium">
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="shrink-0 rounded bg-navy/10 px-1.5 py-0.5 text-[11px] font-semibold text-navy">{role}</span>
                          <span className="truncate">{name}</span>
                        </span>
                        <span className="shrink-0 text-xs text-navy">Receipts →</span>
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

      <div className="mt-8 text-center text-sm text-gray-600">
        <span>Spot something wrong? </span>
        <EmailAction
          email={contactEmail}
          subject={reportSubject}
          body={reportBody}
          label="Report an issue"
          buttonClassName="font-semibold text-crimson underline underline-offset-2"
          align="center"
        />
      </div>
      <BillTools
        id={bill.id}
        siteUrl={SITE_URL}
        bill={{
          label: bill.label,
          chamber: bill.chamber,
          congress: bill.congress,
          title,
          dateFiled: bill.dateFiled,
          url: bill.sourceUrls[0]?.url ?? `${SITE_URL}/bills/${bill.id}`,
        }}
      />
      <p className="mt-2 text-center text-[11px] text-gray-400">
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
