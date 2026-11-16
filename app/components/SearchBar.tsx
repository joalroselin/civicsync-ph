"use client";

import { useState } from "react";
import { Spinner, useSearchNavigation } from "./SearchNavigation";

export function SearchBar({ defaultValue = "", autoFocus = false, showSubmit = false }: { defaultValue?: string; autoFocus?: boolean; showSubmit?: boolean }) {
  const { search, pending } = useSearchNavigation();
  const [q, setQ] = useState(defaultValue);

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        (document.activeElement as HTMLElement | null)?.blur(); // close the mobile keyboard
        search(q);
      }}
      className={showSubmit ? "flex gap-2" : undefined}
    >
      <div className="relative min-w-0 flex-1">
        <label htmlFor="search" className="sr-only">
          Search by bill, lawmaker, or topic
        </label>
        {!showSubmit && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            {pending ? (
              <Spinner className="h-[18px] w-[18px] text-navy-ink" />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            )}
          </span>
        )}
        <input
          id="search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus={autoFocus}
          enterKeyHint="search"
          placeholder={showSubmit ? "Bill, lawmaker, or topic" : "Politician, bill title, or topic"}
          aria-keyshortcuts="/"
          className={`peer w-full bg-surface py-3.5 text-gray-900 focus:outline-none focus:ring-2 focus:ring-navy-ink ${
            showSubmit
              ? "rounded-lg border border-gray-400 px-3 text-base placeholder:text-gray-600"
              : "rounded-2xl border-0 pl-11 pr-4 text-[15px] shadow-sm ring-1 ring-gray-200 placeholder:text-gray-400"
          }`}
        />
        {!q && !showSubmit && (
          <kbd
            aria-hidden
            className="pointer-events-none absolute right-3.5 top-1/2 hidden -translate-y-1/2 rounded-md px-2 py-0.5 font-sans text-xs text-gray-500 ring-1 ring-gray-200 peer-focus:opacity-0 md:block"
          >
            /
          </kbd>
        )}
      </div>
      {showSubmit && (
        <button
          type="submit"
          className="shrink-0 rounded-lg bg-crimson px-3.5 font-semibold text-white hover:bg-red-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy-ink"
        >
          Search
        </button>
      )}
    </form>
  );
}
