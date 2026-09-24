import { BillListSkeleton } from "../../components/Skeleton";

/**
 * Scoped to detail pages on purpose: a root-level loading.tsx would also
 * cover /receipts and cut short the search overlay (SearchNavigation.tsx).
 */
export default function Loading() {
  return (
    <main className="p-5">
      <div className="mb-5 h-7 w-40 animate-pulse rounded bg-gray-200" />
      <BillListSkeleton count={4} />
    </main>
  );
}
