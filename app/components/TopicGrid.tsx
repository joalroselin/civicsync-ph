import Link from "next/link";
import type { PolicyArea } from "@/lib/batasWatch";

/** Topic tiles linking to /topics/[id]; counts are 20th Congress bills. */
export function TopicGrid({ topics }: { topics: PolicyArea[] }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {topics.map((t) => (
        <li key={t.id}>
          <Link
            href={`/topics/${t.id}`}
            className="flex h-full flex-col justify-between gap-1 rounded-2xl bg-white p-3.5 ring-1 ring-gray-200/70 transition hover:ring-navy/30"
          >
            <span className="text-sm font-semibold leading-snug text-gray-900">{t.label}</span>
            <span className="text-xs text-gray-500">{t.primaryBillCount.toLocaleString()} bills</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
