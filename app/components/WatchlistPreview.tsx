"use client";

import Link from "next/link";
import { useWatchlist } from "./WatchlistProvider";
import { StatusBadge } from "./StatusBadge";

export function WatchlistPreview() {
  const { items, ready } = useWatchlist();
  if (!ready) return null;

  return (
    <section aria-labelledby="watchlist-heading">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 id="watchlist-heading" className="font-display text-lg font-semibold">
          Your Watchlist
        </h2>
        {items.length > 0 && (
          <Link href="/watchlist" className="text-sm font-semibold text-navy">
            See all
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          Tap the bookmark on any bill to follow it here.
        </p>
      ) : (
        <ul className="-mx-5 flex snap-x gap-3 no-scrollbar overflow-x-auto px-5 pb-1 md:mx-0 md:px-0 lg:flex-col lg:overflow-visible lg:pb-0">
          {items.slice(0, 5).map((b) => (
            <li key={b.id} className="w-64 shrink-0 snap-start lg:w-auto">
              <Link
                href={`/bills/${b.id}`}
                className="flex h-full flex-col gap-2 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70"
              >
                <span className="text-xs font-semibold text-navy">{b.label}</span>
                <span className="line-clamp-2 text-sm font-medium leading-snug">{b.title}</span>
                <span className="mt-auto">
                  <StatusBadge status={b.status} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
