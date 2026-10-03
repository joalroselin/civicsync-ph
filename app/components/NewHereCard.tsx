"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "civicsync:intro-dismissed";

/** A short intro for first-time visitors; hidden for good once dismissed. */
export function NewHereCard() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      setShow(!localStorage.getItem(KEY));
    } catch {
      setShow(true);
    }
  }, []);
  if (!show) return null;

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(KEY, "1");
    } catch {}
  };

  return (
    <section className="relative rounded-2xl bg-white p-4 pr-10 shadow-sm ring-1 ring-gray-200/70">
      <h2 className="font-display text-base font-semibold">New here?</h2>
      <ul className="mt-2 space-y-1.5 text-sm leading-relaxed text-gray-600">
        <li>
          <strong className="text-gray-900">Search</strong> a lawmaker to see every bill they’ve filed since 1987.
        </li>
        <li>
          <strong className="text-gray-900">Follow</strong> bills with the bookmark. No account needed.
        </li>
        <li>
          Not sure what a status means?{" "}
          <Link href="/how-bills-become-law" className="font-semibold text-navy underline underline-offset-2">
            How a bill becomes law
          </Link>
        </li>
      </ul>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
        </svg>
      </button>
    </section>
  );
}
