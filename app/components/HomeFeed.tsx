"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FeedBill } from "@/lib/feed";
import { BillRow } from "./BillCard";

type View = "filed" | "moved";
type Chamber = "all" | "senate" | "house";
const PREF_KEY = "civicsync:home-feed";

/**
 * Home feed: "Newly filed" or "On the move", filtered by chamber. One panel,
 * two small controls, so the page stays uncluttered. Remembers the last
 * choice on this device.
 */
export function HomeFeed({ filed, moved, trackingSince }: { filed: { senate: FeedBill[]; house: FeedBill[] } | null; moved: FeedBill[] | null; trackingSince: string }) {
  const [view, setView] = useState<View>("filed");
  const [chamber, setChamber] = useState<Chamber>("all");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(PREF_KEY) ?? "{}");
      if (saved.view === "filed" || saved.view === "moved") setView(saved.view);
      if (["all", "senate", "house"].includes(saved.chamber)) setChamber(saved.chamber);
    } catch {}
  }, []);
  const save = (next: { view?: View; chamber?: Chamber }) => {
    try {
      localStorage.setItem(PREF_KEY, JSON.stringify({ view, chamber, ...next }));
    } catch {}
  };

  const rows: FeedBill[] =
    view === "filed"
      ? chamber === "all"
        ? [...(filed?.senate ?? []), ...(filed?.house ?? [])].sort((a, b) => (b.dateFiled ?? "").localeCompare(a.dateFiled ?? ""))
        : filed?.[chamber] ?? []
      : (moved ?? []).filter((b) => chamber === "all" || b.chamber === chamber);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Segmented
          label="Show"
          value={view}
          onChange={(v) => {
            setView(v);
            save({ view: v });
          }}
          options={[
            { value: "filed", label: "Newly filed" },
            { value: "moved", label: "On the move" },
          ]}
        />
        <Pills
          value={chamber}
          onChange={(c) => {
            setChamber(c);
            save({ chamber: c });
          }}
        />
      </div>

      <section className="overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-gray-200/70" aria-live="polite">
        <p className="flex items-center justify-between border-b border-gray-100 bg-gray-50/80 px-4 py-2.5 text-xs text-gray-500">
          <span className="font-semibold uppercase tracking-wider text-gray-600">
            {chamber === "all" ? "Senate and House" : chamber === "senate" ? "Senate" : "House of Representatives"}
          </span>
          <span>{view === "filed" ? "Newest filings first" : "Latest action first"}</span>
        </p>
        {rows.length > 0 ? (
          <ul className="divide-y divide-gray-100">
            {rows.map((b) => (
              <li key={b.routeId}>
                <BillRow bill={b} movedOn={view === "moved" ? b.movedOn : undefined} />
              </li>
            ))}
          </ul>
        ) : (
          <Empty view={view} chamber={chamber} unavailable={view === "filed" ? !filed : !moved} trackingSince={trackingSince} />
        )}
        {view === "moved" && rows.length > 0 && (
          <p className="border-t border-gray-100 px-4 py-2.5 text-[11px] text-gray-500">
            Bills that passed a reading, were scheduled for debate, or moved between chambers in the last 45 days.{" "}
            <Link href="/how-bills-become-law" className="underline underline-offset-2 hover:text-navy-ink">
              What the steps mean
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}

function Empty({ view, chamber, unavailable, trackingSince }: { view: View; chamber: Chamber; unavailable: boolean; trackingSince: string }) {
  let text = "Nothing to show right now.";
  if (unavailable) text = "The live tracker isn’t responding right now. Try again in a few minutes.";
  else if (view === "moved" && chamber === "senate")
    text = `We check every Senate bill’s status daily (since ${trackingSince}). Senate moves will show here as they happen.`;
  else if (view === "moved") text = "No bills moved past committee in the last 45 days.";
  return <p className="px-4 py-6 text-center text-sm leading-relaxed text-gray-500">{text}</p>;
}

function Segmented<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-xl bg-gray-100 p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
            value === o.value ? "bg-surface text-navy-ink shadow-sm" : "text-gray-600 hover:text-gray-800"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Pills({ value, onChange }: { value: Chamber; onChange: (c: Chamber) => void }) {
  const options: { value: Chamber; label: string }[] = [
    { value: "all", label: "All" },
    { value: "senate", label: "Senate" },
    { value: "house", label: "House" },
  ];
  return (
    <div role="group" aria-label="Chamber" className="flex gap-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${
            value === o.value ? "bg-navy text-white ring-navy-ink" : "bg-surface text-gray-600 ring-gray-200 hover:ring-navy-ink/40"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
