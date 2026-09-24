"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useWatchlist } from "./WatchlistProvider";
import { Logo } from "./Logo";
import { Credit } from "./Credit";

const tabs = [
  { href: "/", label: "Home", icon: HomeIcon, match: (p: string) => p === "/" },
  {
    href: "/receipts",
    label: "Receipts",
    icon: ReceiptIcon,
    match: (p: string) => p.startsWith("/receipts") || p.startsWith("/people") || p.startsWith("/bills"),
  },
  { href: "/watchlist", label: "Watchlist", icon: BookmarkIcon, match: (p: string) => p.startsWith("/watchlist") },
];

/** Phones: fixed tab bar. Hidden from md up, where SideNav takes over. */
export function BottomNav() {
  const pathname = usePathname();
  const { items } = useWatchlist();

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-20 border-t md:hidden border-gray-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto flex max-w-md">
        {tabs.map(({ href, label, icon: Icon, match }) => {
          const active = match(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${
                  active ? "text-navy" : "text-gray-500"
                }`}
              >
                <Icon active={active} />
                {label}
                {href === "/watchlist" && items.length > 0 && (
                  <span className="absolute right-[calc(50%-22px)] top-1.5 min-w-[18px] rounded-full bg-crimson px-1 text-center text-[10px] leading-[18px] text-white">
                    {items.length}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Tablet and up: sticky left sidebar with the same destinations. */
export function SideNav() {
  const pathname = usePathname();
  const { items } = useWatchlist();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-3 py-6 md:flex lg:w-64 lg:px-4">
      <Link href="/" className="mb-8 flex items-center gap-2.5 px-3">
        <Logo size={28} />
        <span className="font-display text-lg font-semibold text-gray-900">CivicSync PH</span>
      </Link>
      <nav aria-label="Main">
        <ul className="flex flex-col gap-1">
          {tabs.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    active ? "bg-navy/10 text-navy" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  }`}
                >
                  <Icon active={active} />
                  <span className="flex-1">{label}</span>
                  {href === "/watchlist" && items.length > 0 && (
                    <span className="min-w-[20px] rounded-full bg-crimson px-1.5 text-center text-[11px] leading-5 text-white">
                      {items.length}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="mt-auto space-y-2 px-3">
        <p className="text-[11px] leading-relaxed text-gray-400">
          Data from BetterGov Open Congress and BatasWatch. Verify against official records.
        </p>
        <Credit />
      </div>
    </aside>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1v-9.5Z" strokeLinejoin="round" />
    </svg>
  );
}

function ReceiptIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2V3Z" fill={active ? "currentColor" : "none"} strokeLinejoin="round" />
      <path d="M9 8h6M9 12h6" stroke={active ? "white" : "currentColor"} strokeLinecap="round" />
    </svg>
  );
}

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M6 3h12v18l-6-4-6 4V3Z" strokeLinejoin="round" />
    </svg>
  );
}
