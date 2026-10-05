import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { parseBillNumber, searchBills, searchPeople } from "@/lib/openCongress";
import { BATASWATCH_CONGRESS, fromBatasWatchNumber, getMeasureByNumber, listPolicyAreas, semanticSearch, toBatasWatchNumber } from "@/lib/batasWatch";
import { summaryFromBatasWatch, summaryFromOpenCongress, summaryFromSemantic, type BillSummary } from "@/lib/bills";
import { getSiteSettings } from "@/lib/content";
import { highlightTerms, nameMatches } from "@/lib/search";
import { searchIndex, type IndexedBill } from "@/lib/billIndex";
import { withAuthorLinks, withProfiles } from "@/lib/authorIndex";
import { BillList, BillRow } from "../components/BillCard";
import { LiveDataUnavailable } from "../components/LiveDataUnavailable";
import { PersonCard } from "../components/PersonCard";
import { SearchBar } from "../components/SearchBar";
import { SearchLink, Spinner } from "../components/SearchNavigation";
import { BillListSkeleton } from "../components/Skeleton";
import { PageHeader, Pager } from "../components/PageHeader";
import { TopicGrid } from "../components/TopicGrid";
import { Filters } from "./Filters";

export const metadata: Metadata = { title: "Receipts" };

const PAGE_SIZE = 20;
/** Below this, semantic matches are mostly noise. */
const MIN_SCORE = 0.62;

type Params = { q?: string; page?: string; chamber?: string; congress?: string };

export default async function ReceiptsPage(props: { searchParams: Promise<Params> }) {
  const searchParams = await props.searchParams;
  const q = searchParams.q?.trim() ?? "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const chamber = searchParams.chamber === "senate" || searchParams.chamber === "house" ? searchParams.chamber : undefined;
  const congress = Number(searchParams.congress) || undefined;

  return (
    <main className="px-5 pb-5 md:pt-4">
      <PageHeader title="Receipts" />
      <p className="-mt-2 mb-4 text-sm text-gray-600">Every bill a lawmaker has authored, across all 13 congresses on record.</p>
      <div className="max-w-2xl">
        <SearchBar key={q} defaultValue={q} autoFocus={!q} />
        {q && !parseBillNumber(q) && <Filters q={q} chamber={chamber} congress={congress ? String(congress) : undefined} />}
      </div>
      {q ? <Results q={q} page={page} chamber={chamber} congress={congress} /> : <Empty />}
    </main>
  );
}

/**
 * - Lawmakers whose names start with what was typed (strict, so "rice"
 *   doesn't find "Erice").
 * - Otherwise "Best matches": meaning-based search over 20th Congress bills.
 * - Then every bill on record (Open Congress full-text, 1987 onward), which
 *   can take ~5s uncached, so it streams in behind its own skeleton.
 */
async function Results({ q, page, chamber, congress }: { q: string; page: number; chamber?: "senate" | "house"; congress?: number }) {
  const billNo = parseBillNumber(q);
  const firstPage = page === 1;
  const terms = billNo ? [] : highlightTerms(q);

  const people = billNo || !firstPage ? [] : await searchPeople({ q, limit: 8 })
          .then((ps) => withProfiles(ps.filter((p) => nameMatches(p, q)).slice(0, 6)))
          .catch(() => null);
  const isPersonSearch = (people?.length ?? 0) > 0;
  const showBest = !billNo && !isPersonSearch && firstPage && (!congress || congress === BATASWATCH_CONGRESS);

  const [exact, best] = await Promise.all([
    billNo && firstPage
      ? getMeasureByNumber(toBatasWatchNumber(billNo.subtype, billNo.number)!)
          .then((m) => (m ? [summaryFromBatasWatch(m)] : []))
          .catch(() => null)
      : Promise.resolve([]),
    showBest ? semanticSearch({ q, chamber, limit: 12, minScore: MIN_SCORE }).then((hits) => withAuthorLinks(hits.slice(0, 6).map(summaryFromSemantic))).catch(() => null) : Promise.resolve([]),
  ]);

  return (
    <div className="mt-6 flex max-w-4xl flex-col gap-8">
      {isPersonSearch && (
        <Section id="people" title="Lawmakers" note="Tap a name for every bill they’ve filed">
          <ul className="grid gap-2 sm:grid-cols-2">
            {people!.map((p) => (
              <li key={p.id}>
                <PersonCard person={p} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {exact === null || best === null ? <LiveDataUnavailable what="Search of 20th Congress bills" /> : null}

      {exact && exact.length > 0 && (
        <Section id="exact" title="20th Congress">
          <BillList bills={exact} />
        </Section>
      )}

      {best && best.length > 0 && (
        <Section id="best" title="Best matches · 20th Congress" note="Ranked by meaning, with plain-language summaries">
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-gray-200/70">
            {best.map((b) => (
              <li key={b.routeId}>
                <BillRow bill={b} summary={b.summary} highlight={terms} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {!billNo && (!congress || congress === BATASWATCH_CONGRESS) && (page === 1 || congress === BATASWATCH_CONGRESS) && (
        <ThisCongress q={q} page={page} chamber={chamber} paged={congress === BATASWATCH_CONGRESS} terms={terms} exclude={(best ?? []).map((b) => b.routeId)} />
      )}

      {congress !== BATASWATCH_CONGRESS && (
      <Suspense key={`${q}|${page}|${chamber}|${congress}`} fallback={<BillsFallback />}>
        <RecordBills
          q={q}
          page={page}
          billNo={billNo}
          chamber={chamber}
          congress={congress}
          terms={terms}
          exclude={[
            ...(exact ?? []),
            ...(best ?? []),
            // Already listed under "This Congress" (first 10).
            ...(!billNo && !congress && page === 1 ? searchIndex(q, { chamber, limit: 10 }).results.map((b) => ({ routeId: b.n })) : []),
          ].map((b) => b.routeId)}
          hasOtherResults={(people?.length ?? 0) + (exact?.length ?? 0) + (best?.length ?? 0) > 0}
        />
      </Suspense>
      )}
    </div>
  );
}

async function RecordBills({
  q,
  page,
  billNo,
  chamber,
  congress,
  terms,
  exclude,
  hasOtherResults,
}: {
  q: string;
  page: number;
  billNo: ReturnType<typeof parseBillNumber>;
  chamber?: "senate" | "house";
  congress?: number;
  terms: string[];
  exclude: string[];
  hasOtherResults: boolean;
}) {
  const bills = await searchBills({
    q: billNo ? String(billNo.number) : q,
    subtype: billNo?.subtype ?? (chamber === "senate" ? "SB" : chamber === "house" ? "HB" : undefined),
    congress,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  }).catch(() => null);

  if (!bills) return <ErrorNote />;

  // Bills already shown above aren't repeated here.
  const skip = new Set(exclude);
  const summaries = bills.data
    .map((b) => summaryFromOpenCongress(b))
    .filter((b) => !skip.has(b.routeId));

  if (summaries.length === 0) {
    if (hasOtherResults) return null;
    return (
      <p className="rounded-2xl bg-surface p-5 text-center text-sm text-gray-600 ring-1 ring-gray-200">
        No matches for <span className="font-semibold">“{q}”</span>
        {chamber || congress ? " with these filters" : ""}. Try a last name, a keyword from the bill title, or a bill number like “SB 1294”.
      </p>
    );
  }

  const scope = [congress ? `${congress}th Congress` : "All congresses", chamber === "senate" ? "Senate" : chamber === "house" ? "House" : null].filter(Boolean).join(" · ");
  return (
    <Section
      id="bills"
      title={`Every bill on record · ${bills.total.toLocaleString()}`}
      note={`${scope}. From Open Congress (1987 to about Sept 2025). Matches any title containing your words, newest first.`}
    >
      <BillList bills={summaries} highlight={terms} />
      <Pager
        basePath="/receipts"
        params={{ q, chamber, congress: congress ? String(congress) : undefined }}
        page={page}
        hasMore={bills.hasMore}
      />
    </Section>
  );
}

/**
 * 20th Congress title/author matches from our own nightly copy (CS-306):
 * instant, current, and still works when the sources are down.
 */
function ThisCongress({ q, page, chamber, paged, terms, exclude }: { q: string; page: number; chamber?: "senate" | "house"; paged: boolean; terms: string[]; exclude: string[] }) {
  const skip = new Set(exclude);
  const size = paged ? PAGE_SIZE : 10;
  const { total, results } = searchIndex(q, { chamber, limit: size + skip.size, offset: paged ? (page - 1) * size : 0 });
  const rows = results.filter((b) => !skip.has(b.n)).slice(0, size);
  if (!total) return null;
  const more = new URLSearchParams({ q, congress: String(BATASWATCH_CONGRESS), ...(chamber ? { chamber } : {}) });
  return (
    <Section id="this-congress" title={`This Congress · ${total.toLocaleString()} ${total === 1 ? "bill" : "bills"}`} note="Every 20th Congress bill whose title or author matches your words, newest first.">
      <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-gray-200/70">
        {rows.map((b) => (
          <li key={b.n}>
            <BillRow bill={indexedToSummary(b)} highlight={terms} />
          </li>
        ))}
      </ul>
      {paged ? (
        <Pager basePath="/receipts" params={{ q, chamber, congress: String(BATASWATCH_CONGRESS) }} page={page} hasMore={page * size < total} />
      ) : (
        total > size && (
          <Link href={`/receipts?${more}`} className="mt-3 inline-block text-sm font-semibold text-navy-ink hover:text-crimson-ink">
            See all {total.toLocaleString()} this Congress →
          </Link>
        )
      )}
    </Section>
  );
}

function indexedToSummary(b: IndexedBill): BillSummary {
  const p = fromBatasWatchNumber(b.n);
  return {
    routeId: b.n,
    label: p ? `${p.subtype} ${p.number}` : b.n,
    congress: BATASWATCH_CONGRESS,
    title: b.t || "Untitled bill",
    dateFiled: b.f,
    status: b.s || "Filed",
    // authorLine shows the first name and "+N" for the rest.
    authors: b.a ? [b.a, ...Array.from({ length: Math.max(0, b.k - 1) }, () => "")] : [],
  };
}

function BillsFallback() {
  return (
    <section aria-label="Loading bills on record">
      <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
        <Spinner className="h-3.5 w-3.5 text-gray-500" />
        Searching all 13 congresses…
      </div>
      <BillListSkeleton count={3} />
    </section>
  );
}

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`${id}-heading`}>
      <div className="mb-3">
        <h2 id={`${id}-heading`} className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </h2>
        {note && <p className="mt-0.5 text-xs text-gray-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}

async function Empty() {
  const [{ homeSuggestions }, topics] = await Promise.all([getSiteSettings(), listPolicyAreas().catch(() => [])]);
  return (
    <div className="mt-6 flex max-w-4xl flex-col gap-8">
      <section aria-labelledby="try-heading">
        <h2 id="try-heading" className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          Try
        </h2>
        <ul className="flex flex-wrap gap-2">
          {homeSuggestions.map((s) => (
            <li key={s}>
              <SearchLink q={s} className="block rounded-full bg-surface px-3.5 py-1.5 text-sm font-medium shadow-sm ring-1 ring-gray-200/70 hover:ring-navy-ink/30">
                {s}
              </SearchLink>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-gray-500">
          Or type a lawmaker’s name or a bill number, like “SB 1294”, or{" "}
          <Link href="/lawmakers" className="font-semibold text-navy-ink underline underline-offset-2">
            browse and compare all lawmakers
          </Link>
          .
        </p>
      </section>

      {topics.length > 0 && (
        <section aria-labelledby="topics-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="topics-heading" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Browse by topic · 20th Congress
            </h2>
            <Link href="/topics" className="text-sm font-semibold text-navy-ink hover:text-crimson-ink">
              All topics
            </Link>
          </div>
          <TopicGrid topics={topics.slice(0, 8)} />
        </section>
      )}
    </div>
  );
}

function ErrorNote() {
  return (
    <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm text-crimson-ink ring-1 ring-red-200">
      Couldn’t reach Open Congress right now. Check your connection and try again.
    </p>
  );
}
