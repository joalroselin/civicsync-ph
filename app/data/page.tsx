import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "../components/PageHeader";

export const metadata: Metadata = {
  title: "Open data",
  description: "Download CivicSync PH's nightly data on Philippine bills, lawmakers, laws and status changes. Free to use under CC BY 4.0.",
};

const RAW = "https://raw.githubusercontent.com/joalroselin/civicsync-ph/main/data";
const REPO = "https://github.com/joalroselin/civicsync-ph/tree/main/data";

const DATASETS = [
  { file: "search/bills-20.json", title: "All 20th Congress bills", what: "Number, chamber, title, first author, number of authors, status, filing date, topic and official record link for every bill (~14,000)." },
  { file: "status/changes.json", title: "Status changes (last 120 days)", what: "Every bill whose status changed, with the date, the old status and the new one. Older months are in status/archive/." },
  { file: "status/latest.json", title: "Today’s status of every bill", what: "The status of each bill at the last nightly check." },
  { file: "lawmakers.json", title: "Lawmakers and their record", what: "All current senators and representatives: bills per congress, bills that became law this Congress, top topics, frequent co-authors and the committees their bills go to." },
  { file: "laws.json", title: "Laws and IRR deadlines", what: "Every 20th Congress Republic Act: signed text link, effectivity, and who must write its implementing rules and by when (read automatically from the law)." },
];

export default function DataPage() {
  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="Open data" />
      <div className="max-w-3xl">
        <p className="text-[15px] leading-relaxed text-gray-700">
          Everything behind CivicSync, free to download and reuse: for research, journalism, classes, or other civic projects. Updated every night;
          every past version is kept in the{" "}
          <a href={REPO} className="font-semibold text-navy-ink underline underline-offset-2" target="_blank" rel="noreferrer">
            GitHub history
          </a>
          .
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {DATASETS.map((d) => (
            <li key={d.file} className="rounded-2xl bg-surface p-4 ring-1 ring-gray-200/70">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900">{d.title}</h2>
                  <p className="mt-0.5 text-sm leading-relaxed text-gray-600">{d.what}</p>
                  <p className="mt-1 font-mono text-[11px] text-gray-500">data/{d.file} · JSON</p>
                </div>
                <a
                  href={`${RAW}/${d.file}`}
                  download
                  className="shrink-0 rounded-xl bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-blue-900"
                >
                  Download
                </a>
              </div>
            </li>
          ))}
        </ul>

        <section className="mt-8 space-y-2 text-sm leading-relaxed text-gray-700">
          <h2 className="font-display text-lg font-semibold text-gray-900">Using it</h2>
          <p>
            <strong>Licence: CC BY 4.0.</strong> Use, share and adapt it freely, including commercially. Credit “CivicSync PH”, plus the original
            sources, BetterGov Open Congress and BatasWatch.
          </p>
          <p>
            Field descriptions are in the{" "}
            <a href={`${REPO}/README.md`} className="font-semibold text-navy-ink underline underline-offset-2" target="_blank" rel="noreferrer">
              data README
            </a>
            . Prefer feeds? See{" "}
            <Link href="/feeds" className="font-semibold text-navy-ink underline underline-offset-2">
              RSS feeds
            </Link>
            .
          </p>
          <p className="text-xs text-gray-500">
            Topics and IRR deadlines are generated automatically and can be wrong. Check the official Senate or House record before citing.
          </p>
        </section>
      </div>
    </main>
  );
}
