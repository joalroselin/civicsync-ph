import { semanticSearch } from "@/lib/batasWatch";
import { summaryFromSemantic } from "@/lib/bills";
import { BillRow } from "./BillCard";

/**
 * "Related bills": closest 20th Congress bills by meaning. Streams in after
 * the page (wrap in <Suspense>), and hides itself if nothing good comes back.
 */
export async function SimilarBills({ query, excludeNumber }: { query: string; excludeNumber: string }) {
  const hits = await semanticSearch({ q: query.slice(0, 400), limit: 8, minScore: 0.7 }).catch(() => []);
  const bills = hits
    .filter((h) => h.number !== excludeNumber)
    .slice(0, 5)
    .map(summaryFromSemantic);
  if (!bills.length) return null;
  return (
    <section className="mt-4 print:hidden rounded-2xl bg-surface shadow-sm ring-1 ring-gray-200/70" aria-labelledby="related-heading">
      <div className="px-4 pt-4">
        <h3 id="related-heading" className="text-xs font-semibold uppercase tracking-wider text-gray-500">
          Related bills · 20th Congress
        </h3>
        <p className="mt-0.5 text-xs text-gray-500">Similar in what they’d do, filed by any lawmaker.</p>
      </div>
      <ul className="mt-2 divide-y divide-gray-100">
        {bills.map((b) => (
          <li key={b.routeId}>
            <BillRow bill={b} />
          </li>
        ))}
      </ul>
    </section>
  );
}
