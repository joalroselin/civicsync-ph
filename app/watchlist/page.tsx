"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useWatchlist } from "../components/WatchlistProvider";
import { StatusBadge } from "../components/StatusBadge";
import { WatchButton } from "../components/WatchButton";
import { PageHeader } from "../components/PageHeader";
import { BillListSkeleton } from "../components/Skeleton";
import { formatDate } from "@/lib/format";

export default function WatchlistPage() {
  const { items, ready, user, syncAvailable, signIn, signOut, refreshStatuses } = useWatchlist();
  const [authError, setAuthError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!ready) return;
    setRefreshing(true);
    refreshStatuses().finally(() => setRefreshing(false));
    // Refresh once per visit, not on every list change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return (
    <main className="px-5 pb-5 md:pt-4">
      <PageHeader title="Watchlist" />

      <section className="mb-5 max-w-2xl rounded-2xl bg-white p-4 text-sm shadow-sm ring-1 ring-gray-200/70">
        {!syncAvailable ? (
          <p className="text-gray-600">Saved on this device. Sign-in sync will be available once accounts are set up.</p>
        ) : user ? (
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 text-gray-600">
              Synced as <span className="font-semibold text-gray-900">{user.displayName ?? user.email}</span>
            </p>
            <button onClick={() => signOut()} className="shrink-0 text-sm font-semibold text-navy">
              Sign out
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <p className="text-gray-600">Saved on this device. Sign in to keep it across devices.</p>
            <button
              onClick={() => signIn().catch(() => setAuthError("Sign-in didn’t complete. Try again."))}
              className="shrink-0 rounded-xl bg-navy px-3.5 py-2 text-sm font-semibold text-white"
            >
              Sign in
            </button>
          </div>
        )}
        {authError && <p className="mt-2 text-xs text-crimson">{authError}</p>}
      </section>

      {!ready ? (
        <BillListSkeleton />
      ) : items.length === 0 ? (
        <div className="mx-auto max-w-lg rounded-[20px] border border-dashed border-gray-300 p-8 text-center md:mt-8">
          <p className="font-display text-lg font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-gray-600">
            Find a bill in Receipts and tap the bookmark to follow it.
          </p>
          <Link href="/receipts" className="mt-4 inline-block rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white">
            Browse Receipts
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-3 text-xs text-gray-500">
            {items.length} {items.length === 1 ? "bill" : "bills"} · {refreshing ? "Checking for status updates…" : "Status up to date"}
          </p>
          <ul className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {items.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/bills/${b.id}`}
                  className="flex h-full items-start gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-gray-200/70 hover:ring-navy/30"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="rounded-md bg-navy/10 px-1.5 py-0.5 font-semibold text-navy">{b.label}</span>
                      <span>Saved {formatDate(new Date(b.savedAt).toISOString())}</span>
                    </div>
                    <p className="mt-1.5 line-clamp-3 text-[15px] font-medium leading-snug">{b.title}</p>
                    <div className="mt-2">
                      <StatusBadge status={b.status} />
                    </div>
                  </div>
                  <WatchButton variant="icon" bill={b} />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
