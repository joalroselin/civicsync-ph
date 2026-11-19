"use client";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-2xl font-semibold text-navy-ink">Something went wrong</h1>
      <p className="mt-2 text-sm text-gray-600">The data source may be slow or unreachable.</p>
      <button onClick={reset} className="mt-5 rounded-lg bg-crimson px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-900">
        Try again
      </button>
    </main>
  );
}
