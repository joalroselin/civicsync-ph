import type { Metadata } from "next";
import Link from "next/link";
import { STAGES } from "@/lib/billStages";
import { PageHeader } from "../components/PageHeader";

export const metadata: Metadata = {
  title: "How a bill becomes law in the Philippines",
  description: "The eight steps from filing to Republic Act, in plain language, and what each bill status on CivicSync means.",
};

export default function HowBillsBecomeLawPage() {
  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="How a bill becomes law" />
      <div className="max-w-3xl">
        <section className="rounded-[20px] bg-navy p-6 text-white shadow-md md:p-8">
          <h2 className="font-display text-2xl font-semibold leading-tight md:text-3xl">From filing to Republic Act, in 8 steps.</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-indigo-100 md:text-lg">
            Thousands of bills are filed every Congress, and only a small share become law. Here’s the path each one takes, and what the statuses
            on CivicSync mean.
          </p>
        </section>

        <ol className="mt-6 space-y-3">
          {STAGES.map((s, i) => (
            <li key={s.short} className="flex gap-4 rounded-2xl bg-white p-4 ring-1 ring-gray-200/70 md:p-5">
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full font-display text-sm font-semibold ${
                  i === STAGES.length - 1 ? "bg-crimson text-white" : "bg-navy/10 text-navy"
                }`}
              >
                {i + 1}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">{s.title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-gray-700">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className="mt-8 rounded-2xl bg-white p-5 ring-1 ring-gray-200/70">
          <h2 className="font-display text-lg font-semibold">Good to know</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-[15px] leading-relaxed text-gray-700">
            <li>
              <strong>Consolidated or substituted</strong> means a committee merged similar bills into one new bill. The ideas continue in that bill,
              even though the original number stops moving.
            </li>
            <li>
              <strong>Bills don’t carry over.</strong> Anything not passed when a Congress ends (every three years) has to be filed again.
            </li>
            <li>
              A bill can start in either chamber, except bills about money (spending, taxes, tariffs, public debt) and local or private bills, which must start in the House.
            </li>
          </ul>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/receipts" className="rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900">
            Look up a bill
          </Link>
          <Link href="/watchlist" className="rounded-xl bg-white px-4 py-3 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:ring-navy/40">
            Follow bills on your Watchlist
          </Link>
        </div>
        <p className="mt-8 text-xs text-gray-400">
          Simplified from the 1987 Constitution (Article VI) and the rules of the Senate and House. For legal work, check the official rules.
        </p>
      </div>
    </main>
  );
}
