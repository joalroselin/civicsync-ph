import { Suspense } from "react";
import Link from "next/link";
import { CURRENT_CONGRESS } from "@/lib/openCongress";
import { listMeasures } from "@/lib/batasWatch";
import { summaryFromBatasWatch } from "@/lib/bills";
import { BillList } from "./components/BillCard";
import { Greeting } from "./components/Greeting";
import { SearchBar } from "./components/SearchBar";
import { WatchlistPreview } from "./components/WatchlistPreview";
import { BillListSkeleton } from "./components/Skeleton";
import { LiveDataUnavailable } from "./components/LiveDataUnavailable";

export const revalidate = 1800;

const SUGGESTIONS = ["Hontiveros", "Tulfo", "Magna Carta", "SB 1294", "rice"];

export default function Home() {
  return (
    <main className="flex flex-col gap-7 p-5">
      <header className="rounded-[20px] bg-navy p-5 pb-6 text-white shadow-md">
        <div className="mb-4 flex items-center gap-2">
          <Logo />
          <span className="font-display text-sm font-semibold tracking-wide">CivicSync PH</span>
        </div>
        <Greeting />
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight">
          Search a politician or a bill to get started.
        </h1>
        <div className="mt-5">
          <SearchBar />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <Link
              key={s}
              href={`/receipts?q=${encodeURIComponent(s)}`}
              className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-indigo-100 hover:bg-white/20"
            >
              {s}
            </Link>
          ))}
        </div>
      </header>

      <WatchlistPreview />

      <section aria-labelledby="recent-heading">
        <div className="mb-3">
          <h2 id="recent-heading" className="font-display text-lg font-semibold">
            Recently filed
          </h2>
          <p className="text-xs text-gray-500">{CURRENT_CONGRESS}th Congress · Senate and House</p>
        </div>
        <Suspense fallback={<BillListSkeleton count={4} />}>
          <RecentBills />
        </Suspense>
      </section>

      <SourcesNote />
    </main>
  );
}

async function RecentBills() {
  // Open Congress's catalogue lags by about a year, so the live feed comes
  // from BatasWatch. Take the newest from each chamber so the Senate isn't
  // drowned out by the House's much higher filing volume.
  const [senate, house] = await Promise.all([
    listMeasures({ chamber: "senate", sort: "latest" }).catch(() => null),
    listMeasures({ chamber: "house", sort: "latest" }).catch(() => null),
  ]);
  if (!senate && !house) {
    return <LiveDataUnavailable what="The latest filings feed" />;
  }
  const bills = [...(senate?.items.slice(0, 3) ?? []), ...(house?.items.slice(0, 3) ?? [])]
    .filter((m) => m.title || m.longTitle)
    .sort((x, y) => (y.filedAt ?? "").localeCompare(x.filedAt ?? ""))
    .map(summaryFromBatasWatch);

  if (bills.length === 0) return <p className="text-sm text-gray-500">No recently filed bills found.</p>;
  return <BillList bills={bills} />;
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

function Logo() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden>
      <rect width="32" height="32" rx="8" fill="white" />
      <path d="M9 11h14M9 16h14M9 21h9" stroke="#1E3A8A" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="23" cy="21" r="3" fill="#991B1B" />
    </svg>
  );
}
