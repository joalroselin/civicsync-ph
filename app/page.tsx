import { Suspense } from "react";
import { CURRENT_CONGRESS } from "@/lib/openCongress";
import { getSiteSettings } from "@/lib/content";
import { listMeasures } from "@/lib/batasWatch";
import { HomeFeed } from "./components/HomeFeed";
import { newlyFiled, recentlyMoved } from "@/lib/feed";
import { Greeting } from "./components/Greeting";
import { SearchBar } from "./components/SearchBar";
import { SearchLink } from "./components/SearchNavigation";
import { WatchlistPreview } from "./components/WatchlistPreview";
import { BillListSkeleton } from "./components/Skeleton";
import { LiveDataUnavailable } from "./components/LiveDataUnavailable";
import { Logo } from "./components/Logo";
import { HeroAnimation } from "./components/HeroAnimation";
import { Dismissible } from "./components/Dismissible";
import { SectionHeading, StartHere } from "./components/StartHere";

export const revalidate = 1800;

export default async function Home() {
  const { homeSuggestions } = await getSiteSettings();
  return (
    <main className="flex flex-col gap-8 p-5 md:py-8 lg:gap-10">
      {/* 1. Primary action: search. The pulse strip gives context at a glance. */}
      <header className="overflow-hidden rounded-[20px] bg-navy text-white shadow-md">
        <div className="flex items-center gap-10 p-5 pb-6 md:p-8 lg:p-10">
          <div className="min-w-0 flex-1">
          {/* The sidebar carries the brand from md up. */}
          <div className="mb-4 flex items-center gap-2 md:hidden">
            <Logo inverted />
            <span className="font-display text-sm font-semibold tracking-wide">CivicSync PH</span>
          </div>
          <Greeting />
          <h1 className="mt-1 max-w-2xl font-display text-2xl font-semibold leading-tight md:text-3xl lg:text-4xl">
            Search a politician or a bill to get started.
          </h1>
          <div className="mt-5 max-w-2xl md:mt-6">
            <SearchBar />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-indigo-200">Try</span>
            {homeSuggestions.map((s) => (
              <SearchLink
                key={s}
                q={s}
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 hover:bg-white/20 md:text-sm"
              >
                {s}
              </SearchLink>
            ))}
          </div>
          </div>
          {/* Fills the empty right side on wide screens only. */}
          <div className="hidden shrink-0 xl:block">
            <HeroAnimation />
          </div>
        </div>
        <Suspense fallback={<PulseStrip />}>
          <Pulse />
        </Suspense>
      </header>

      <div className="flex flex-col gap-8 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-10">
        {/* 2. Main content: what's new in Congress, one panel per chamber. */}
        <section aria-labelledby="recent-heading" className="lg:col-start-1 lg:row-start-1">
          <SectionHeading id="recent-heading" eyebrow={`${CURRENT_CONGRESS}th Congress · live`} title="Latest from Congress" />
          <Suspense fallback={<ChamberSkeleton />}>
            <RecentBills />
          </Suspense>
        </section>

        {/* 3. Personal + help. Watchlist shows first for returning visitors. */}
        <aside className="flex flex-col gap-8 lg:sticky lg:top-8 lg:col-start-2 lg:row-start-1">
          <WatchlistPreview />
          <Dismissible storageKey="civicsync:start-dismissed" label="Start here">
            <StartHere />
          </Dismissible>
          <SourcesNote />
        </aside>
      </div>
    </main>
  );
}

/** Live counts for the hero: this Congress so far, and the past week. */
async function Pulse() {
  const [senate, house] = await Promise.all([chamberPulse("senate"), chamberPulse("house")]);
  if (!senate && !house) return null;
  return (
    <PulseStrip
      stats={[
        { value: ((senate?.total ?? 0) + (house?.total ?? 0)).toLocaleString(), label: "bills filed this Congress" },
        { value: ((senate?.week ?? 0) + (house?.week ?? 0)).toLocaleString(), label: "filed in the last 7 days" },
        { value: `${(senate?.total ?? 0).toLocaleString()}/${(house?.total ?? 0).toLocaleString()}`, label: "Senate / House" },
      ]}
    />
  );
}

async function chamberPulse(chamber: "senate" | "house") {
  try {
    const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
    let week = 0;
    let total = 0;
    // Newest first; stop once filings are older than a week (capped for politeness).
    for (let page = 1; page <= 8; page++) {
      const res = await listMeasures({ chamber, sort: "latest", page });
      total = res.total;
      const recent = res.items.filter((m) => (m.filedAt ?? "") > since).length;
      week += recent;
      if (recent < res.items.length || !res.hasMore) break;
    }
    return { total, week };
  } catch {
    return null;
  }
}

function PulseStrip({ stats }: { stats?: { value: string; label: string }[] }) {
  const items = stats ?? Array.from({ length: 3 }, () => ({ value: "", label: "" }));
  return (
    <dl className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10 bg-white/5">
      {items.map((s, i) => (
        <div key={i} className="px-2.5 py-3 sm:px-3 md:px-6 md:py-4 lg:px-10">
          <dt className="sr-only">{s.label}</dt>
          <dd>
            <span className="block min-h-[1.75rem] whitespace-nowrap font-display text-base font-semibold tracking-tight sm:text-lg md:text-2xl">
              {s.value || <span className="inline-block h-5 w-14 animate-pulse rounded bg-white/15 align-middle" />}
            </span>
            <span className="mt-0.5 block min-h-[1rem] text-[11px] leading-tight text-indigo-200 md:text-xs">{s.label}</span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

async function RecentBills() {
  // Open Congress's catalogue lags by about a year, so the live feed comes from BatasWatch.
  const [filed, moved] = await Promise.all([newlyFiled(), recentlyMoved()]);
  if (!filed && !moved) return <LiveDataUnavailable what="The latest filings feed" />;
  return <HomeFeed filed={filed} moved={moved} />;
}

function ChamberSkeleton() {
  return (
    <div>
      <div className="mb-3 h-10 w-64 animate-pulse rounded-xl bg-gray-100" />
      <div className="rounded-2xl bg-white p-1 ring-1 ring-gray-200/70">
        <BillListSkeleton count={4} />
      </div>
    </div>
  );
}

function SourcesNote() {
  return (
    <aside className="rounded-2xl bg-gray-100 p-4 text-xs leading-relaxed text-gray-600">
      <p className="font-semibold text-gray-700">Where the data comes from</p>
      <p className="mt-1">
        Authorship and history across all congresses:{" "}
        <a className="underline" href="https://open-congress-api.bettergov.ph" target="_blank" rel="noreferrer">
          BetterGov Open Congress
        </a>
        . Live status and committee (20th Congress only):{" "}
        <a className="underline" href="https://bills.juris.ph" target="_blank" rel="noreferrer">
          BatasWatch
        </a>
        , an independent source. Always verify against the official record linked on each bill.
      </p>
    </aside>
  );
}
