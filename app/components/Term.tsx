"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";

const OPEN_EVENT = "civicsync:term-open";
const WIDTH = 260;

/**
 * An inline term with a definition that stays out of the way: dotted
 * underline, definition on hover (mouse), tap (touch) or focus (keyboard).
 * Only one is open at a time; Escape or tapping elsewhere closes it.
 */
export function Term({ children, definition }: { children: React.ReactNode; definition: string }) {
  const id = useId();
  const ref = useRef<HTMLButtonElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  // A mouse click right after hover-open should keep it open, not toggle it shut.
  const openedByHover = useRef(false);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean } | null>(null);

  const open = useCallback(() => {
    clearTimeout(closeTimer.current);
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(WIDTH, window.innerWidth - 32);
    const left = Math.max(16, Math.min(r.left + r.width / 2 - width / 2, window.innerWidth - width - 16));
    // Flip above the word when there isn't room below.
    const above = r.bottom + 140 > window.innerHeight && r.top > 160;
    setPos({ top: above ? r.top - 8 : r.bottom + 8, left, above });
    window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: id }));
  }, [id]);
  const close = useCallback(() => {
    openedByHover.current = false;
    setPos(null);
  }, []);
  const closeSoon = () => {
    closeTimer.current = setTimeout(close, 120);
  };

  useEffect(() => {
    if (!pos) return;
    const onOther = (e: Event) => (e as CustomEvent).detail !== id && close();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && close();
    window.addEventListener(OPEN_EVENT, onOther);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", close, { passive: true });
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener(OPEN_EVENT, onOther);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", close);
      window.removeEventListener("resize", close);
    };
  }, [pos, id, close]);

  return (
    <>
      <button
        ref={ref}
        type="button"
        aria-describedby={pos ? id : undefined}
        aria-expanded={!!pos}
        onClick={() => {
          if (openedByHover.current) openedByHover.current = false;
          else if (pos) close();
          else open();
        }}
        // Hover only for real mice; touch gets tap via onClick.
        onPointerEnter={(e) => {
          if (e.pointerType !== "mouse") return;
          openedByHover.current = !pos;
          open();
        }}
        onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}
        onFocus={(e) => e.target.matches(":focus-visible") && open()}
        onBlur={close}
        className="cursor-help underline decoration-gray-400 decoration-dotted decoration-[1.5px] underline-offset-[3px] transition-colors hover:decoration-navy focus-visible:rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/40 aria-expanded:decoration-navy"
      >
        {children}
      </button>
      {pos && (
        <span
          id={id}
          role="tooltip"
          onPointerEnter={() => clearTimeout(closeTimer.current)}
          onPointerLeave={(e) => e.pointerType === "mouse" && closeSoon()}
          style={{ top: pos.top, left: pos.left, width: Math.min(WIDTH, typeof window === "undefined" ? WIDTH : window.innerWidth - 32) }}
          className={`fixed z-50 rounded-xl bg-gray-900 px-3 py-2 text-left text-[13px] font-normal leading-snug text-white shadow-lg ${pos.above ? "-translate-y-full" : ""}`}
        >
          {definition}
        </span>
      )}
    </>
  );
}
