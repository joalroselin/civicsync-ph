import Link from "next/link";
import { Suspense } from "react";
import { CURRENT_CONGRESS } from "@/lib/openCongress";
import { getSiteSettings } from "@/lib/content";
import { HomeFeed } from "./components/HomeFeed";
import { chamberPulse, newlyFiled, recentlyMoved } from "@/lib/feed";
import { trackingSince } from "@/lib/statusHistory";
import { formatDate, ordinal } from "@/lib/format";
import { SearchBar } from "./components/SearchBar";
import { SearchLink } from "./components/SearchNavigation";
import { WatchlistPreview } from "./components/WatchlistPreview";
import { BillListSkeleton } from "./components/Skeleton";
import { LiveDataUnavailable } from "./components/LiveDataUnavailable";
import { Logo } from "./components/Logo";
import { Dismissible } from "./components/Dismissible";
import { RssLink } from "./components/RssLink";
import { StartHere } from "./components/StartHere";

export const revalidate = 1800;

export default async function Home() {
  const { homeSuggestions } = await getSiteSettings();
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 px-5 pb-12 pt-7 md:px-8 md:pt-12">
      <header>
        <div className="mb-6 flex items-center gap-2 font-semibold text-navy-ink md:hidden">
          <Logo size={26} />
          <span>CivicSync PH</span>
        </div>
        <h1 className="max-w-xl border-l-4 border-flag-yellow pl-4 font-display text-4xl font-semibold leading-[1.12] text-navy-ink sm:text-5xl">
          Follow bills in the Philippine Congress
        </h1>
        <p className="mt-5 max-w-[58ch] text-lg leading-relaxed text-gray-800">
          CivicSync PH helps you find out what a bill proposes, who filed it, and where it stands.
          Save bills to your Watchlist to follow their progress.
        </p>
        <div className="mt-6 max-w-xl">
          <SearchBar showSubmit />
          {homeSuggestions.length > 0 && (
            <ul aria-label="Suggested searches" className="mt-2 flex flex-wrap items-baseline gap-x-4 text-sm sm:text-base">
              <li aria-hidden className="text-gray-600">Try</li>
              {homeSuggestions.map((s) => (
                <li key={s}>
                  <SearchLink q={s} className="inline-block py-1 text-navy-ink underline underline-offset-4 hover:text-crimson-ink">
                    {s}
                  </SearchLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </header>

      <Dismissible storageKey="civicsync:start-dismissed" label="Start here">
        <StartHere />
      </Dismissible>

      <section aria-labelledby="recent-heading" className="border-t border-gray-200 pt-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
          <div>
            <h2 id="recent-heading" className="font-display text-2xl font-semibold text-navy-ink sm:text-3xl">
              Latest from Congress
            </h2>
            <p className="mt-1 text-sm text-gray-600">{ordinal(CURRENT_CONGRESS)} Congress</p>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <Link href="/changes" className="font-medium text-navy-ink underline underline-offset-4 hover:text-crimson-ink">
              What changed this week
            </Link>
            <RssLink href="/feeds" />
          </div>
        </div>
        <Suspense fallback={<BillListSkeleton count={4} />}>
          <RecentBills />
        </Suspense>
        <Suspense fallback={null}>
          <FilingCounts />
        </Suspense>
      </section>

      <WatchlistPreview />
      <SourcesNote />
    </main>
  );
}

async function FilingCounts() {
  const [senate, house] = await Promise.all([chamberPulse("senate"), chamberPulse("house")]);
  if (!senate && !house) return null;
  const total = (senate?.total ?? 0) + (house?.total ?? 0);
  const week = (senate?.week ?? 0) + (house?.week ?? 0);
  const chambers = [senate && `${senate.total.toLocaleString()} in the Senate`, house && `${house.total.toLocaleString()} in the House`].filter(Boolean).join(", ");
  return (
    <p className="mt-4 text-sm leading-relaxed text-gray-600">
      The tracker lists {total.toLocaleString()} {total === 1 ? "bill" : "bills"} filed this Congress ({chambers}),
      including {week.toLocaleString()} filed in the last seven days.
    </p>
  );
}

async function RecentBills() {
  // Open Congress's catalogue lags by about a year, so the live feed comes from BatasWatch.
  const [filed, moved] = await Promise.all([newlyFiled(), recentlyMoved()]);
  if (!filed && !moved) return <LiveDataUnavailable what="The latest filings feed" />;
  return <HomeFeed filed={filed} moved={moved} trackingSince={formatDate(trackingSince)} />;
}

function SourcesNote() {
  return (
    <section aria-labelledby="sources-heading" className="border-t border-gray-200 pt-6 text-sm leading-relaxed text-gray-600">
      <h2 id="sources-heading" className="text-base font-semibold text-navy-ink">Where the data comes from</h2>
      <p className="mt-2">
        Bill authors and legislative history come from{" "}
        <a className="text-navy-ink underline underline-offset-4" href="https://open-congress-api.bettergov.ph" target="_blank" rel="noreferrer">
          BetterGov Open Congress
        </a>
        . Bill status and committee information for the {ordinal(CURRENT_CONGRESS)} Congress come from{" "}
        <a className="text-navy-ink underline underline-offset-4" href="https://bills.juris.ph" target="_blank" rel="noreferrer">
          BatasWatch
        </a>
        , an independent tracker. Each bill page links to the official record when available.{" "}
        <Link className="text-navy-ink underline underline-offset-4" href="/data">
          Download the data
        </Link>
        .
      </p>
    </section>
  );
}
