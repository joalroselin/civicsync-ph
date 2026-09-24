export function BillListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <ul className="flex flex-col gap-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="animate-pulse rounded-2xl bg-white p-4 ring-1 ring-gray-200/70">
          <div className="h-3 w-24 rounded bg-gray-200" />
          <div className="mt-3 h-4 w-full rounded bg-gray-200" />
          <div className="mt-2 h-4 w-2/3 rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}
