import Link from "next/link";

export const metadata = { title: "Offline" };

export default function Offline() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
      <h1 className="font-display text-2xl font-semibold text-navy-ink">You’re offline</h1>
      <p className="mt-2 text-sm text-gray-600">
        Pages you’ve opened before are still available. Your Watchlist is saved on this device.
      </p>
      <Link href="/watchlist" className="mt-5 rounded-lg bg-crimson px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-900">
        Open Watchlist
      </Link>
    </main>
  );
}
