import type { Metadata } from "next";
import Link from "next/link";
import { allRecentChanges, trackingSince, type StatusChange } from "@/lib/statusHistory";
import { fromBatasWatchNumber } from "@/lib/batasWatch";
import { formatDate, toTitleCase, displayStatus } from "@/lib/format";
import { weeklySummary } from "@/lib/weekly";
import { PageHeader } from "../components/PageHeader";
import { RssLink } from "../components/RssLink";
import { ShareImageButton } from "../components/ShareImage";

export const metadata: Metadata = {
  title: "What changed in Congress",
  description: "Every Senate and House bill whose status changed, day by day, from the 20th Congress of the Philippines.",
  alternates: { types: { "application/rss+xml": [{ url: "/feeds/changes", title: "CivicSync PH: What changed" }] } },
};

const label = (n: string) => {
  const p = fromBatasWatchNumber(n);
  return p ? `${p.subtype} ${p.number}` : n;
};

export default async function ChangesPage(props: { searchParams: Promise<{ chamber?: string }> }) {
  const { chamber: ch } = await props.searchParams;
  const chamber = ch === "senate" || ch === "house" ? ch : undefined;
  const week = await weeklySummary();
  const changes = allRecentChanges.filter((c) => !chamber || c.chamber === chamber);
  const byDate = new Map<string, StatusChange[]>();
  for (const c of changes) byDate.set(c.date, [...(byDate.get(c.date) ?? []), c]);
  const pill = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${active ? "bg-navy text-white ring-navy" : "bg-surface text-gray-600 ring-gray-200 hover:ring-navy-ink/40"}`;

  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="What changed" />
      <div className="max-w-3xl">
        <section className="rounded-[20px] bg-navy p-5 text-white shadow-md md:p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">This week · {week.range}</p>
          <dl className="mt-3 grid grid-cols-3 gap-3">
            {[
              [week.filed, "bills filed"],
              [week.moved, "bills moved"],
              [week.laws.length, "became law"],
            ].map(([n, l]) => (
              <div key={l as string}>
                <dt className="sr-only">{l}</dt>
                <dd>
                  <span className="block font-display text-2xl font-semibold">{(n as number).toLocaleString()}</span>
                  <span className="text-xs text-indigo-200">{l}</span>
                </dd>
              </div>
            ))}
          </dl>
        </section>
        <ShareImageButton src="/changes/week/card" filename="civicsync-this-week" intro="This week in Congress as an image for Instagram, Facebook or group chats." />

        <div className="mt-6 flex flex-wrap items-center gap-2">
          {[
            { v: undefined, l: "All" },
            { v: "senate", l: "Senate" },
            { v: "house", l: "House" },
          ].map((o) => (
            <Link key={o.l} href={o.v ? `/changes?chamber=${o.v}` : "/changes"} className={pill(chamber === o.v)} scroll={false}>
              {o.l}
            </Link>
          ))}
          <span className="ml-auto">
            <RssLink href="/feeds/changes" />
          </span>
        </div>

        {byDate.size === 0 ? (
          <p className="mt-4 rounded-2xl bg-surface p-5 text-sm text-gray-600 ring-1 ring-gray-200/70">
            We check every bill’s status daily, starting {formatDate(trackingSince)}. Changes will appear here from the next check onward.
          </p>
        ) : (
          [...byDate.entries()].map(([date, list]) => (
            <section key={date} className="mt-5">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {formatDate(date)} · {list.length} {list.length === 1 ? "change" : "changes"}
              </h2>
              <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-surface ring-1 ring-gray-200/70">
                {list.map((c) => (
                  <li key={c.number + c.to}>
                    <Link href={`/bills/${c.number}`} className="block px-4 py-3 hover:bg-gray-50">
                      <span className="text-xs font-semibold text-navy-ink">{label(c.number)}</span>
                      <span className="ml-2 text-xs text-gray-500">{c.chamber === "senate" ? "Senate" : "House"}</span>
                      <span className="mt-0.5 line-clamp-2 block text-[15px] font-medium leading-snug text-gray-900">{toTitleCase(c.title)}</span>
                      <span className="mt-1 block text-xs text-gray-700">
                        <span className="font-semibold">Now:</span> {displayStatus(c.to)}
                      </span>
                      <span className="block text-xs text-gray-500">Was: {displayStatus(c.from)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
        <p className="mt-6 text-[11px] text-gray-500">
          From a daily check of every 20th Congress bill’s status, since {formatDate(trackingSince)}. Older months are in the open data on GitHub.
        </p>
      </div>
    </main>
  );
}
