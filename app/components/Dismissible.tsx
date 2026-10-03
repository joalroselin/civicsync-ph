"use client";

import { useEffect, useState } from "react";

type Phase = "shown" | "fading" | "collapsing" | "gone";

/**
 * Wraps a section that can be closed for good. Closing fades it out, then
 * eases its height (and the gap after it) to zero so the sections below
 * glide up instead of jumping. Instant for people who prefer reduced motion.
 *
 * `gap` is the parent's flex gap in px, closed in step with the height.
 */
export function Dismissible({ storageKey, gap = 32, label, children }: { storageKey: string; gap?: number; label: string; children: React.ReactNode }) {
  const [phase, setPhase] = useState<Phase>("shown");

  useEffect(() => {
    try {
      if (localStorage.getItem(storageKey)) setPhase("gone");
    } catch {}
  }, [storageKey]);

  const dismiss = () => {
    try {
      localStorage.setItem(storageKey, "1");
    } catch {}
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return setPhase("gone");
    setPhase("fading");
    setTimeout(() => setPhase("collapsing"), 180);
    setTimeout(() => setPhase("gone"), 180 + 320);
  };

  if (phase === "gone") return null;
  const collapsed = phase === "collapsing";
  return (
    <div
      className="relative grid transition-[grid-template-rows,margin,opacity,transform] duration-300 ease-out"
      style={{
        gridTemplateRows: collapsed ? "0fr" : "1fr",
        marginBottom: collapsed ? -gap : 0,
        opacity: phase === "shown" ? 1 : 0,
        transform: phase === "shown" ? "none" : "scale(0.98)",
      }}
    >
      <div className="min-h-0 overflow-hidden">{children}</div>
      <button
        type="button"
        onClick={dismiss}
        aria-label={`Dismiss ${label}`}
        disabled={phase !== "shown"}
        className="absolute right-0 top-0 grid h-8 w-8 place-items-center rounded-full text-gray-500 transition hover:bg-gray-200/60 hover:text-gray-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  );
}
