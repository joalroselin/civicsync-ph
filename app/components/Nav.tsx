"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useWatchlist } from "./WatchlistProvider";
import { Logo } from "./Logo";
import { SocialIcons } from "./SocialIcons";
import { ThemeToggle } from "./ThemeToggle";
import type { SocialLink } from "@/lib/content";

const REPO_URL = "https://hellojoal.dev/";
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
    <p className={`text-xs leading-relaxed text-gray-600 ${className}`}>
      <Link href="/privacy" className="underline underline-offset-2 hover:text-crimson-ink">
        Privacy first
      </Link>{" "}
      · Built by{" "}
      <a
        href={REPO_URL}
        target="_blank"
        rel="noreferrer"
        className="font-semibold underline underline-offset-2 hover:text-crimson-ink"
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
    `relative flex w-full flex-col items-center gap-0.5 border-t-2 py-2 text-xs font-semibold focus-visible:-outline-offset-2 ${active ? "border-flag-yellow text-navy-ink" : "border-transparent text-gray-500"}`;
  const moreActive = moreOpen || SECONDARY_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      {moreOpen && <MoreSheet socialLinks={socialLinks} onClose={() => setMoreOpen(false)} />}
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 print:hidden border-t border-gray-200 bg-surface/95 backdrop-blur pb-[env(safe-area-inset-bottom)] md:hidden"
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
              aria-controls={moreOpen ? "more-menu" : undefined}
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
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 768px)");
    const closeOnDesktop = () => {
      if (desktop.matches) dialog.current?.close();
    };
    if (!dialog.current?.open) dialog.current?.showModal();
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  const row = "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-semibold text-gray-800 active:bg-gray-100";
  return (
    <dialog
      id="more-menu"
      ref={dialog}
      aria-labelledby="more-heading"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget || (e.target instanceof Element && e.target.closest('a[href^="/"]'))) {
          e.currentTarget.close();
        }
      }}
      className="fixed inset-x-0 bottom-0 top-auto m-0 max-h-[calc(100dvh-1rem)] w-full max-w-none overflow-y-auto rounded-t-2xl bg-surface text-gray-900 backdrop:bg-black/45"
    >
      <div className="px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-3">
        <div className="flex items-center justify-between gap-2 border-b border-gray-200 pl-3">
          <h2 id="more-heading" className="font-display text-xl font-semibold text-navy-ink">More</h2>
          <button type="button" onClick={() => dialog.current?.close()} className="min-h-11 px-3 text-sm font-semibold text-navy-ink">
            Close
          </button>
        </div>
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
              <span className="ml-auto text-xs font-normal text-gray-500">Suggest &amp; vote ↗</span>
            </a>
          </li>
        </ul>
        <div className="mt-3 border-t border-gray-100 px-3 pt-4">
          <div className="flex items-center gap-3">
            <SocialIcons links={socialLinks} />
            <span className="h-4 w-px bg-gray-200" aria-hidden />
            <ThemeToggle />
          </div>
          <FooterLine className="mt-3" />
        </div>
      </div>
    </dialog>
  );
}

/** Tablet and up: sticky left sidebar. */
export function SideNav({ socialLinks = [] }: { socialLinks?: SocialLink[] }) {
  const pathname = usePathname();
  const { items } = useWatchlist();

  return (
    <aside className="sticky top-0 hidden h-screen w-56 print:!hidden shrink-0 flex-col border-r border-gray-200 bg-surface px-3 py-6 md:flex lg:w-64 lg:px-4">
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
                    active ? "bg-navy-ink/10 text-navy-ink" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
                    active ? "bg-crimson-ink/10 text-crimson-ink" : "text-gray-500 hover:bg-gray-100 hover:text-crimson-ink"
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
        <div className="flex items-center gap-3">
          <SocialIcons links={socialLinks} />
          <span className="h-4 w-px bg-gray-200" aria-hidden />
          <ThemeToggle />
        </div>
        <FooterLine />
      </div>
    </aside>
  );
}

function InfoIcon({ active, small }: { active: boolean; small?: boolean }) {
  const s = small ? 18 : 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} aria-hidden>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 11v5M12 7.75h.01" strokeLinecap="round" />
    </svg>
  );
}

function HeartIcon({ active, small }: { active: boolean; small?: boolean }) {
  const s = small ? 18 : 24;
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} aria-hidden>
      {/* Drawn to fill the same 17px box as the info circle, so both read as one size. */}
      <path d="M12 20.5S3.5 15.4 3.5 9.2A4.7 4.7 0 0 1 12 6.4a4.7 4.7 0 0 1 8.5 2.8c0 6.2-8.5 11.3-8.5 11.3Z" strokeLinejoin="round" />
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
