"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
      <p className="font-display text-xl font-semibold">Something went wrong</p>
      <p className="mt-2 text-sm text-gray-600">The data source may be slow or unreachable.</p>
      <button onClick={reset} className="mt-5 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white">
        Try again
      </button>
    </main>
  );
}
