import Link from "next/link";
import { getSiteSettings } from "@/lib/content";
import { SearchBar } from "./components/SearchBar";
import { SearchLink } from "./components/SearchNavigation";

/** Not a dead end: search right here, try a topic, or head somewhere useful. */
export default async function NotFound() {
  const { homeSuggestions } = await getSiteSettings();
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-xl flex-col justify-center px-5 py-12">
      <p className="font-display text-sm font-semibold uppercase tracking-wider text-crimson-ink">Page not found</p>
      <h1 className="mt-1 font-display text-2xl font-semibold md:text-3xl">We couldn’t find that page.</h1>
      <p className="mt-2 text-gray-600">
        The link may be old, or the bill number may not exist yet. Search for a lawmaker, a bill number like “SB 1294”, or a topic.
      </p>
      <div className="mt-6">
        <SearchBar autoFocus />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs text-gray-500">Try</span>
        {homeSuggestions.map((s) => (
          <SearchLink key={s} q={s} className="rounded-full bg-surface px-3 py-1 text-xs font-medium ring-1 ring-gray-200 hover:ring-navy-ink/40">
            {s}
          </SearchLink>
        ))}
      </div>
      <nav className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm font-semibold text-navy-ink" aria-label="Elsewhere on CivicSync">
        <Link href="/">Home</Link>
        <Link href="/topics">Browse topics</Link>
        <Link href="/how-bills-become-law">How a bill becomes law</Link>
        <Link href="/watchlist">Your Watchlist</Link>
      </nav>
    </main>
  );
}
