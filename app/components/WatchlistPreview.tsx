"use client";

import Link from "next/link";
import { useWatchlist } from "./WatchlistProvider";
import { StatusBadge } from "./StatusBadge";

export function WatchlistPreview() {
  const { items, ready } = useWatchlist();
  if (!ready || items.length === 0) return null;

  return (
    <section aria-labelledby="watchlist-heading" className="border-t border-gray-200 pt-6">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-5 gap-y-1">
        <h2 id="watchlist-heading" className="font-display text-2xl font-semibold text-navy-ink">Your Watchlist</h2>
        <Link href="/watchlist" className="text-sm text-navy-ink underline underline-offset-4 hover:text-crimson-ink">
          View Watchlist
        </Link>
      </div>
      <ul className="divide-y divide-gray-200">
        {items.slice(0, 5).map((b) => (
          <li key={b.id}>
            <Link
              href={`/bills/${b.id}`}
              className="block py-3 hover:text-navy-ink"
            >
              <span className="block text-sm text-gray-600">{b.label}</span>
              <span className="mt-0.5 block font-medium leading-snug">
                {b.title}
              </span>
              <span className="mt-1.5 block">
                <StatusBadge status={b.status} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
