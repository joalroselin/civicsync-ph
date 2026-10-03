"use client";

import { useEffect, useRef, useState } from "react";

const SHARE = {
  title: "CivicSync PH",
  text: "Look up Philippine lawmakers and the bills they file. Free, no sign-up.",
  url: "https://civicsync-ph-gamma.vercel.app",
};

/**
 * Share menu: opens on hover (desktop) or tap (touch). Instagram has no web
 * share URL, so its option copies the link and opens Instagram instead.
 */
export function ShareSiteButton({ label, className }: { label: string; className: string }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // True while the menu is open because of hover, so a click doesn't close it.
  const openedByHover = useRef(false);

  useEffect(() => setCanNativeShare(typeof navigator !== "undefined" && !!navigator.share), []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const flash = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2600);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(SHARE.url);
      return true;
    } catch {
      return false;
    }
  };

  // Hover only for mouse pointers, so a tap doesn't open-then-close the menu.
  const hoverOpen = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    clearTimeout(closeTimer.current);
    if (!open) openedByHover.current = true;
    setOpen(true);
  };
  const hoverClose = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    closeTimer.current = setTimeout(() => {
      openedByHover.current = false;
      setOpen(false);
    }, 180);
  };

  const item =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-gray-800 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none";

  return (
    <div ref={wrapRef} className="relative inline-block" onPointerEnter={hoverOpen} onPointerLeave={hoverClose}>
      <button
        type="button"
        className={`${className} gap-2`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (openedByHover.current) {
            // Hover already opened it; treat the click as "keep it open".
            openedByHover.current = false;
            setOpen(true);
          } else {
            setOpen((o) => !o);
          }
        }}
      >
        {label}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden className={`transition ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Share CivicSync"
          className="absolute bottom-full left-0 z-20 mb-2 w-60 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-gray-200"
        >
          <a
            role="menuitem"
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(SHARE.url)}`}
            target="_blank"
            rel="noreferrer"
            className={item}
            onClick={() => setOpen(false)}
          >
            <FacebookIcon /> Facebook
          </a>
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={async () => {
              const ok = await copyLink();
              setOpen(false);
              flash(ok ? "Link copied. Paste it in your Instagram story or DM." : "Copy the link: " + SHARE.url);
              window.open("https://www.instagram.com/", "_blank", "noopener");
            }}
          >
            <InstagramIcon /> Instagram
          </button>
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={async () => {
              const ok = await copyLink();
              setOpen(false);
              flash(ok ? "Link copied" : "Copy the link: " + SHARE.url);
            }}
          >
            <LinkIcon /> Copy link
          </button>
          {canNativeShare && (
            <button
              role="menuitem"
              type="button"
              className={item}
              onClick={async () => {
                setOpen(false);
                await navigator.share(SHARE).catch(() => {});
              }}
            >
              <MoreIcon /> More options…
            </button>
          )}
        </div>
      )}

      {toast && (
        <p role="status" className="absolute left-0 top-full z-20 mt-2 w-64 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg">
          {toast}
        </p>
      )}
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#1877F2" />
      <path d="M13.3 19v-6h2l.3-2.4h-2.3V9.1c0-.7.2-1.2 1.2-1.2h1.2V5.8a16 16 0 0 0-1.8-.1c-1.8 0-3 1.1-3 3.1v1.8H9v2.4h2v6h2.3Z" fill="#fff" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <defs>
        <linearGradient id="ig-grad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#F9A13A" />
          <stop offset=".5" stopColor="#E1306C" />
          <stop offset="1" stopColor="#833AB4" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="22" height="22" rx="6" fill="url(#ig-grad)" />
      <rect x="6" y="6" width="12" height="12" rx="3.5" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="2.8" fill="none" stroke="#fff" strokeWidth="1.8" />
      <circle cx="16.3" cy="7.7" r="1" fill="#fff" />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" aria-hidden>
      <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" strokeLinecap="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4B5563" strokeWidth="2" aria-hidden>
      <path d="M12 3v12M7 8l5-5 5 5M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
