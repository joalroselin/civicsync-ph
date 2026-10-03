"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const CONGRESSES = [20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8];
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

/** Chamber pills and a Congress picker. State lives in the URL so results can be shared. */
export function Filters({ q, chamber, congress }: { q: string; chamber?: string; congress?: string }) {
  const router = useRouter();
  const href = (next: { chamber?: string; congress?: string }) => {
    const p = new URLSearchParams({ q });
    const c = "chamber" in next ? next.chamber : chamber;
    const g = "congress" in next ? next.congress : congress;
    if (c) p.set("chamber", c);
    if (g) p.set("congress", g);
    return `/receipts?${p}`;
  };
  const pill = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
      active ? "bg-navy text-white ring-navy" : "bg-white text-gray-600 ring-gray-200 hover:ring-navy/40"
    }`;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Filter results">
      {[
        { v: undefined, label: "All" },
        { v: "senate", label: "Senate" },
        { v: "house", label: "House" },
      ].map((o) => (
        <Link key={o.label} href={href({ chamber: o.v })} className={pill(chamber === o.v)} aria-current={chamber === o.v ? "true" : undefined} scroll={false}>
          {o.label}
        </Link>
      ))}
      <span className="mx-1 h-4 w-px bg-gray-200" aria-hidden />
      <label className="sr-only" htmlFor="congress-filter">
        Congress
      </label>
      <select
        id="congress-filter"
        value={congress ?? ""}
        onChange={(e) => router.push(href({ congress: e.target.value || undefined }), { scroll: false })}
        className="rounded-full bg-white py-1 pl-3 pr-7 text-xs font-semibold text-gray-700 ring-1 ring-gray-200 hover:ring-navy/40"
      >
        <option value="">All congresses</option>
        {CONGRESSES.map((n) => (
          <option key={n} value={n}>
            {ordinal(n)} Congress{n === 20 ? " (current)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
