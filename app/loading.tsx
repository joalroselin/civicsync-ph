import { BillListSkeleton } from "./components/Skeleton";

export default function Loading() {
  return (
    <main className="p-5">
      <div className="mb-5 h-7 w-40 animate-pulse rounded bg-gray-200" />
      <BillListSkeleton count={4} />
    </main>
  );
}
