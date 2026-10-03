import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listPolicyAreas, semanticSearch, type PolicyArea } from "@/lib/batasWatch";
import { summaryFromSemantic } from "@/lib/bills";
import { BillRow } from "../../components/BillCard";
import { PageHeader } from "../../components/PageHeader";
import { LiveDataUnavailable } from "../../components/LiveDataUnavailable";

async function loadTopic(id: string): Promise<PolicyArea | null> {
  const topics = await listPolicyAreas().catch(() => []);
  return topics.find((t) => t.id === id) ?? null;
}

export async function generateMetadata(props: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const topic = await loadTopic((await props.params).id);
  if (!topic) return { title: "Topic" };
  return { title: `${topic.label} bills`, description: `${topic.description} Bills filed in the 20th Congress of the Philippines.` };
}

export default async function TopicPage(props: { params: Promise<{ id: string }>; searchParams: Promise<{ chamber?: string }> }) {
  const [{ id }, sp] = await Promise.all([props.params, props.searchParams]);
  const topic = await loadTopic(id);
  if (!topic) notFound();
  const chamber = sp.chamber === "senate" || sp.chamber === "house" ? sp.chamber : undefined;

  // The topic filter needs a query; the topic's own description works best.
  const hits = await semanticSearch({ q: `${topic.label}: ${topic.description}`, category: topic.label, chamber, limit: 50 }).catch(() => null);
  const bills = hits?.map(summaryFromSemantic);

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${active ? "bg-navy text-white ring-navy-ink" : "bg-surface text-gray-600 ring-gray-200 hover:ring-navy-ink/40"}`;

  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="Topics" back="/topics" />
      <div className="max-w-4xl">
        <section className="rounded-[20px] bg-navy p-6 text-white shadow-md md:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-200">20th Congress · Topic</p>
          <h2 className="mt-1 font-display text-2xl font-semibold md:text-3xl">{topic.label}</h2>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-indigo-100">{topic.description}</p>
          <dl className="mt-5 flex gap-6 text-sm">
            <Stat value={topic.primaryBillCount} label="bills" />
            <Stat value={topic.senatePrimaryBillCount} label="Senate" />
            <Stat value={topic.housePrimaryBillCount} label="House" />
          </dl>
        </section>

        <div className="mb-3 mt-6 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Most relevant bills</h2>
          <div className="flex gap-1" role="group" aria-label="Chamber">
            {[
              { v: undefined, label: "All" },
              { v: "senate", label: "Senate" },
              { v: "house", label: "House" },
            ].map((o) => (
              <Link key={o.label} href={o.v ? `/topics/${id}?chamber=${o.v}` : `/topics/${id}`} className={pill(chamber === o.v)} scroll={false}>
                {o.label}
              </Link>
            ))}
          </div>
        </div>

        {!bills ? (
          <LiveDataUnavailable what="Bills for this topic" />
        ) : bills.length === 0 ? (
          <p className="rounded-2xl bg-surface p-5 text-center text-sm text-gray-500 ring-1 ring-gray-200">No bills found for this topic yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-surface shadow-sm ring-1 ring-gray-200/70">
            {bills.map((b) => (
              <li key={b.routeId}>
                <BillRow bill={b} summary={b.summary} />
              </li>
            ))}
          </ul>
        )}
        <p className="mt-3 text-[11px] text-gray-500">
          Showing up to 50 of the closest matches. Topics are assigned automatically by BatasWatch from each bill’s text, so a few may be off.
        </p>
      </div>
    </main>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="sr-only">{label}</dt>
      <dd>
        <span className="block font-display text-xl font-semibold">{value.toLocaleString()}</span>
        <span className="text-xs text-indigo-200">{label}</span>
      </dd>
    </div>
  );
}
