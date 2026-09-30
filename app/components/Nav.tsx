"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useWatchlist } from "./WatchlistProvider";
import { Logo } from "./Logo";
import { SocialIcons } from "./SocialIcons";
import type { SocialLink } from "@/lib/content";

const REPO_URL = "https://github.com/joalroselin/civicsync-ph";
const ROADMAP_URL = "https://civicsyncph.canny.io";

/** Main app destinations: bottom tabs on phones, top of the sidebar on larger screens. */
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

/** Secondary pages: a quieter group in the sidebar; inside "More" on phones. */
const secondary = [
  { href: "/about", label: "About", icon: InfoIcon },
  { href: "/get-involved", label: "Get involved", icon: HeartIcon },
];
const SECONDARY_PATHS = ["/about", "/get-involved", "/press"];

/** One compact line: privacy promise + credit (the AI note lives only here). */
function FooterLine({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[11px] leading-relaxed text-gray-400 ${className}`}>
      <Link href="/about#your-privacy" className="transition hover:text-crimson">
        Privacy first
      </Link>{" "}
      · Built by{" "}
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        className="font-semibold text-gray-500 underline decoration-gray-300 underline-offset-2 transition hover:text-crimson hover:decoration-crimson"
      >
        HelloJoal
      </a>{" "}
      · assisted by AI
    </p>
  );
}

/** Phones: fixed tab bar with a "More" sheet. Hidden from md up, where SideNav takes over. */
export function BottomNav({ socialLinks = [] }: { socialLinks?: SocialLink[] }) {
  const pathname = usePathname();
  const { items } = useWatchlist();
  const [moreOpen, setMoreOpen] = useState(false);

  // Close the sheet after navigating.
  useEffect(() => setMoreOpen(false), [pathname]);

  const tabClass = (active: boolean) =>
    `relative flex w-full flex-col items-center gap-0.5 py-2.5 text-[11px] font-semibold ${active ? "text-navy" : "text-gray-500"}`;
  const moreActive = moreOpen || SECONDARY_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      {moreOpen && <MoreSheet socialLinks={socialLinks} onClose={() => setMoreOpen(false)} />}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
      >
        <ul className="mx-auto flex max-w-md">
          {tabs.map(({ href, label, icon: Icon, match }) => {
            const active = !moreOpen && match(pathname);
            return (
              <li key={href} className="flex-1">
                <Link href={href} aria-current={active ? "page" : undefined} className={tabClass(active)}>
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
          <li className="flex-1">
            <button
              type="button"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => setMoreOpen((o) => !o)}
              className={tabClass(moreActive)}
            >
              <MoreIcon active={moreActive} />
              More
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

function MoreSheet({ socialLinks, onClose }: { socialLinks: SocialLink[]; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const row = "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-gray-800 active:bg-gray-100";
  return (
    <div className="fixed inset-0 z-30 md:hidden" role="dialog" aria-modal="true" aria-label="More">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-gray-900/30" />
      <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pb-[calc(76px+env(safe-area-inset-bottom))] pt-3 shadow-2xl">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gray-300" aria-hidden />
        <ul className="flex flex-col">
          {secondary.map(({ href, label, icon: Icon }) => (
            <li key={href}>
              <Link href={href} className={row}>
                <Icon active={false} /> {label}
              </Link>
            </li>
          ))}
          <li>
            <Link href="/press" className={row}>
              <PressIcon /> Press kit
            </Link>
          </li>
          <li>
            <a href={ROADMAP_URL} target="_blank" rel="noreferrer" className={row}>
              <RoadmapIcon /> Roadmap
              <span className="ml-auto text-xs font-normal text-gray-400">Suggest &amp; vote ↗</span>
            </a>
          </li>
        </ul>
        <div className="mt-3 border-t border-gray-100 px-3 pt-4">
          <SocialIcons links={socialLinks} />
          <FooterLine className="mt-3" />
        </div>
      </div>
    </div>
  );
}

/** Tablet and up: sticky left sidebar. */
export function SideNav({ socialLinks = [] }: { socialLinks?: SocialLink[] }) {
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

        <div className="mx-3 my-4 border-t border-gray-100" />

        <ul className="flex flex-col gap-0.5" aria-label="More">
          {secondary.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition ${
                    active ? "bg-crimson/10 text-crimson" : "text-gray-500 hover:bg-gray-100 hover:text-crimson"
                  }`}
                >
                  <Icon active={active} small />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mt-auto space-y-3 px-3">
        <SocialIcons links={socialLinks} />
        <FooterLine />
      </div>
    </aside>
  );
}

function InfoIcon({ active, small }: { active: boolean; small?: boolean }) {
  const s = small ? 18 : 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ active, small }: { active: boolean; small?: boolean }) {
  const s = small ? 18 : 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z" strokeLinejoin="round" />
    </svg>
  );
}

function PressIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 5h13v14H6a2 2 0 0 1-2-2V5ZM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5M8 16h3" />
    </svg>
  );
}

function RoadmapIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3v18M12 5h6l2 2.5L18 10h-6M12 13H6l-2 2.5L6 18h6" />
    </svg>
  );
}

function MoreIcon({ active }: { active: boolean }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
    </svg>
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
