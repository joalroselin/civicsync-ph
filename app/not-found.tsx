import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
      <p className="font-display text-5xl font-semibold text-navy">404</p>
      <p className="mt-2 text-gray-600">We couldn’t find that bill or lawmaker.</p>
      <Link href="/receipts" className="mt-5 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white">
        Search Receipts
      </Link>
    </main>
  );
}
