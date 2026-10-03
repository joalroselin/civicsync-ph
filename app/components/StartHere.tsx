import Link from "next/link";

const TILES = [
  {
    href: "/receipts",
    title: "Look up a lawmaker",
    body: "Every bill they’ve filed since 1987.",
    icon: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
  },
  {
    href: "/how-bills-become-law",
    title: "How a bill becomes law",
    body: "The 8 steps, in plain language.",
    icon: <path d="M4 6h16M4 12h10M4 18h6M17 15l3 3-3 3" />,
  },
  {
    href: "/watchlist",
    title: "Follow bills",
    body: "Bookmark bills. No account needed.",
    icon: <path d="M6 3h12v18l-6-4-6 4z" />,
  },
];

/** Entry points for first-time visitors, kept below the live content. */
export function StartHere() {
  return (
    <section aria-labelledby="start-heading">
      <SectionHeading id="start-heading" eyebrow="New to CivicSync?" title="Start here" />
      <ul className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {TILES.map((t) => (
          <li key={t.href}>
            <Link
              href={t.href}
              className="group flex h-full items-start gap-3 rounded-2xl bg-surface p-4 ring-1 ring-gray-200/70 transition hover:ring-navy-ink/30"
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy-ink/10 text-navy-ink">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  {t.icon}
                </svg>
              </span>
              <span>
                <span className="block text-sm font-semibold text-gray-900 group-hover:text-navy-ink">{t.title}</span>
                <span className="mt-0.5 block text-xs leading-relaxed text-gray-500">{t.body}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Small uppercase label over a section title: gives each block a clear role. */
export function SectionHeading({ id, eyebrow, title, action }: { id: string; eyebrow: string; title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-crimson-ink">{eyebrow}</p>
        <h2 id={id} className="mt-0.5 font-display text-xl font-semibold leading-tight lg:text-2xl">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}
