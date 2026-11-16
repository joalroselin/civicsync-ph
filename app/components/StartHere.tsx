import Link from "next/link";

const LINKS = [
  { href: "/receipts", label: "Browse bills and lawmakers" },
  { href: "/how-bills-become-law", label: "How a bill becomes law" },
  { href: "/watchlist", label: "Open your Watchlist" },
];

export function StartHere() {
  return (
    <nav aria-labelledby="start-heading" className="pr-10">
      <h2 id="start-heading" className="font-semibold text-gray-900">Start here</h2>
      <ul className="flex flex-wrap gap-x-5">
        {LINKS.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="inline-block py-1.5 text-navy-ink underline underline-offset-4 hover:text-crimson-ink">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
