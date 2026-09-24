import Link from "next/link";

export const metadata = { title: "Offline" };

export default function Offline() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
      <p className="font-display text-xl font-semibold">You’re offline</p>
      <p className="mt-2 text-sm text-gray-600">
        Pages you’ve opened before are still available. Your Watchlist is saved on this device.
      </p>
      <Link href="/watchlist" className="mt-5 rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white">
        Open Watchlist
      </Link>
    </main>
  );
}
