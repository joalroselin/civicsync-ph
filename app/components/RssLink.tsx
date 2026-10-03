import Link from "next/link";

/** Small "RSS" link with the standard feed icon. */
export function RssLink({ href, label = "RSS" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-gray-600 ring-1 ring-gray-200 transition hover:text-[#C2410C] hover:ring-[#FDBA74]"
      title="Follow in a news reader (RSS)"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
        <path d="M4 11a9 9 0 0 1 9 9M4 4a16 16 0 0 1 16 16" />
        <circle cx="5" cy="19" r="1.5" fill="currentColor" stroke="none" />
      </svg>
      {label}
    </Link>
  );
}
