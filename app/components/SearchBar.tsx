"use client";

import { useState } from "react";
import { Spinner, useSearchNavigation } from "./SearchNavigation";

export function SearchBar({ defaultValue = "", autoFocus = false }: { defaultValue?: string; autoFocus?: boolean }) {
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
      className="relative"
    >
      <label htmlFor="search" className="sr-only">
        Search a politician or a bill
      </label>
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
        {pending ? (
          <Spinner className="h-[18px] w-[18px] text-navy" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <input
        id="search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        autoFocus={autoFocus}
        enterKeyHint="search"
        placeholder="Politician, bill title, or topic"
        className="w-full rounded-2xl border-0 bg-white py-3.5 pl-11 pr-4 text-[15px] text-gray-900 shadow-sm ring-1 ring-gray-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-navy"
      />
    </form>
  );
}
