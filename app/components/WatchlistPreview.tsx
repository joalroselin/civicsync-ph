"use client";

import Link from "next/link";
import { useWatchlist } from "./WatchlistProvider";
import { StatusBadge } from "./StatusBadge";
import { SectionHeading } from "./StartHere";

export function WatchlistPreview() {
  const { items, ready } = useWatchlist();
  // Empty: stay out of the way; the "Start here" tiles explain following bills.
  if (!ready || items.length === 0) return null;

  return (
    <section aria-labelledby="watchlist-heading">
      <SectionHeading
        id="watchlist-heading"
        eyebrow="Following"
        title="Your Watchlist"
        action={
          <Link
            href="/watchlist"
            className="text-sm font-semibold text-navy-ink hover:text-crimson-ink"
          >
            See all
          </Link>
        }
      />
      <ul className="-mx-5 flex snap-x gap-3 no-scrollbar overflow-x-auto px-5 pb-1 md:mx-0 md:px-0 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.slice(0, 5).map((b) => (
          <li key={b.id} className="w-64 shrink-0 snap-start lg:w-auto">
            <Link
              href={`/bills/${b.id}`}
              className="flex h-full flex-col gap-2 rounded-2xl bg-surface p-4 shadow-sm ring-1 ring-gray-200/70"
            >
              <span className="text-xs font-semibold text-navy-ink">{b.label}</span>
              <span className="line-clamp-2 text-sm font-medium leading-snug">
                {b.title}
              </span>
              <span className="mt-auto">
                <StatusBadge status={b.status} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
