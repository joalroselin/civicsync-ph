"use client";

import { useWatchlist, type WatchedBill } from "./WatchlistProvider";

export function WatchButton({
  bill,
  variant = "full",
}: {
  bill: Omit<WatchedBill, "savedAt">;
  variant?: "full" | "icon";
}) {
  const { isWatched, toggle, ready } = useWatchlist();
  const watched = ready && isWatched(bill.id);

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggle(bill);
        }}
        aria-pressed={watched}
        aria-label={watched ? `Remove ${bill.label} from Watchlist` : `Add ${bill.label} to Watchlist`}
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full transition ${
          watched ? "bg-crimson/10 text-crimson" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
        }`}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill={watched ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M6 3h12v18l-6-4-6 4V3Z" strokeLinejoin="round" />
        </svg>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggle(bill)}
      aria-pressed={watched}
      className={`flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition active:scale-[0.99] ${
        watched ? "bg-white text-crimson ring-2 ring-inset ring-crimson" : "bg-crimson text-white hover:bg-red-900"
      }`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill={watched ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M6 3h12v18l-6-4-6 4V3Z" strokeLinejoin="round" />
      </svg>
      {watched ? "On your Watchlist" : "Add to Watchlist"}
    </button>
  );
}
