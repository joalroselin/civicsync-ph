"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";

interface SearchNavigationValue {
  search: (q: string) => void;
  pending: boolean;
}

const SearchNavigationContext = createContext<SearchNavigationValue | null>(null);

/**
 * Runs search navigations in a transition so we know when results are still
 * loading, and mutes the page meanwhile so people don't tap stale content.
 */
export function SearchNavigationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  // `inert` blocks taps and keyboard focus on the muted page. Set it directly:
  // React 18 doesn't handle the attribute reliably as a prop.
  useEffect(() => {
    contentRef.current?.toggleAttribute("inert", pending);
  }, [pending]);

  const search = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setQuery(trimmed);
      startTransition(() => router.push(`/receipts?q=${encodeURIComponent(trimmed)}`));
    },
    [router]
  );

  return (
    <SearchNavigationContext.Provider value={{ search, pending }}>
      <div ref={contentRef} aria-busy={pending}>
        {children}
      </div>
      {pending && <SearchingOverlay query={query} />}
    </SearchNavigationContext.Provider>
  );
}

function SearchingOverlay({ query }: { query: string }) {
  return (
    <div className="fixed inset-0 z-40 flex cursor-wait items-start justify-center bg-paper/70 px-5 pt-[35vh] backdrop-blur-[2px] animate-[fade-in_150ms_ease-out]">
      <div role="status" className="flex max-w-full items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-lg ring-1 ring-gray-200">
        <Spinner />
        <p className="min-w-0 text-sm text-gray-700">
          Searching for <span className="font-semibold text-gray-900">“{query}”</span>…
        </p>
      </div>
    </div>
  );
}

export function Spinner({ className = "h-5 w-5 text-navy" }: { className?: string }) {
  return (
    <svg className={`shrink-0 animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function useSearchNavigation() {
  const ctx = useContext(SearchNavigationContext);
  if (!ctx) throw new Error("useSearchNavigation must be used inside SearchNavigationProvider");
  return ctx;
}

/** A link to a Receipts search that shows the same loading state as the search bar. */
export function SearchLink({ q, className, children }: { q: string; className?: string; children: React.ReactNode }) {
  const { search } = useSearchNavigation();
  return (
    <Link
      href={`/receipts?q=${encodeURIComponent(q)}`}
      className={className}
      onClick={(e) => {
        // Let modified clicks (new tab, etc.) behave like normal links.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        search(q);
      }}
    >
      {children}
    </Link>
  );
}
