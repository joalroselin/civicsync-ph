import type { SocialLink } from "@/lib/content";

/** Small, muted social icons. Accounts come from Sanity → Site settings. */
export function SocialIcons({ links, className = "" }: { links: SocialLink[]; className?: string }) {
  if (links.length === 0) return null;
  return (
    <ul className={`flex items-center gap-3 ${className}`} aria-label="CivicSync on social media">
      {links.map((l) => (
        <li key={l._key}>
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`CivicSync on ${l.platform}`}
            title={l.platform}
            className="block text-gray-400 transition hover:text-navy"
          >
            <PlatformIcon platform={l.platform} />
          </a>
        </li>
      ))}
    </ul>
  );
}

function PlatformIcon({ platform }: { platform: string }) {
  const p = { width: 16, height: 16, viewBox: "0 0 24 24", "aria-hidden": true };
  switch (platform.toLowerCase()) {
    case "facebook":
      return (
        <svg {...p} fill="currentColor">
          <path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12Z" />
        </svg>
      );
    case "instagram":
      return (
        <svg {...p} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    default:
      // Generic link icon for platforms added later in the Studio
      return (
        <svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" />
        </svg>
      );
  }
}
