"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { FeedBill } from "@/lib/feed";
import { BillRow } from "./BillCard";

type View = "filed" | "moved";
type Chamber = "all" | "senate" | "house";
const PREF_KEY = "civicsync:home-feed";

/**
 * Home feed with activity and chamber filters remembered on this device.
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
      <div className="mb-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <Segmented
          label="Bill activity"
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
        <ChamberSelect
          value={chamber}
          onChange={(c) => {
            setChamber(c);
            save({ chamber: c });
          }}
        />
      </div>

      <div className="border-y border-gray-200" aria-live="polite">
        {rows.length > 0 ? (
          <ul className="divide-y divide-gray-200">
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
          <p className="border-t border-gray-200 px-4 py-3 text-sm leading-relaxed text-gray-600">
            Bills that passed a reading, were scheduled for debate, or moved between chambers in the last 45 days.{" "}
            <Link href="/how-bills-become-law" className="underline underline-offset-2 hover:text-navy-ink">
              What the steps mean
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function Empty({ view, chamber, unavailable, trackingSince }: { view: View; chamber: Chamber; unavailable: boolean; trackingSince: string }) {
  let text = "Nothing to show right now.";
  if (unavailable) text = "The live tracker isn’t responding right now. Try again in a few minutes.";
  else if (view === "moved" && chamber === "senate")
    text = `We check every Senate bill’s status daily (since ${trackingSince}). Senate moves will show here as they happen.`;
  else if (view === "moved") text = "No bills moved past committee in the last 45 days.";
  return <p className="px-4 py-5 text-sm leading-relaxed text-gray-600">{text}</p>;
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
    <div role="group" aria-label={label} className="flex gap-4">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`min-h-11 border-b-2 text-sm font-semibold ${
            value === o.value ? "border-[#fcd116] text-navy-ink" : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ChamberSelect({ value, onChange }: { value: Chamber; onChange: (c: Chamber) => void }) {
  return (
    <label className="flex items-center gap-2 text-sm text-gray-700">
      Chamber
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as Chamber)}
        className="min-h-11 rounded-md border border-gray-300 bg-surface px-2 font-medium text-gray-900"
      >
        <option value="all">All</option>
        <option value="senate">Senate</option>
        <option value="house">House</option>
      </select>
    </label>
  );
}
