import type { SocialLink } from "@/lib/content";

/** Brand colour on hover. Full class names so Tailwind picks them up. */
const HOVER_COLOR: Record<string, string> = {
  facebook: "hover:text-[#1877F2]",
  instagram: "hover:text-[#E1306C]",
};

/** Always shown after the social accounts. */
const EXTRA_LINKS = [
  { key: "roadmap", label: "Roadmap", href: "https://civicsyncph.canny.io", external: true, hover: "hover:text-[#525DF4]" },
  { key: "press", label: "Press kit", href: "/press", external: false, hover: "hover:text-crimson-ink" },
] as const;

/** Small, muted icons: social accounts (from Sanity → Site settings), then Roadmap and Press kit. */
export function SocialIcons({ links, className = "" }: { links: SocialLink[]; className?: string }) {
  return (
    <ul className={`flex items-center gap-3 ${className}`} aria-label="CivicSync elsewhere">
      {links.map((l) => (
        <li key={l._key}>
          <a
            href={l.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`CivicSync on ${l.platform}`}
            title={l.platform}
            className={`block text-gray-400 transition ${HOVER_COLOR[l.platform.toLowerCase()] ?? "hover:text-navy-ink"}`}
          >
            <PlatformIcon platform={l.platform} />
          </a>
        </li>
      ))}
      {EXTRA_LINKS.map((x) => (
        <li key={x.key}>
          <a
            href={x.href}
            {...(x.external ? { target: "_blank", rel: "noreferrer" } : {})}
            aria-label={x.label}
            title={x.label}
            className={`block text-gray-400 transition ${x.hover}`}
          >
            <PlatformIcon platform={x.key} />
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
    case "roadmap":
      // Signpost: the public roadmap on Canny
      return (
        <svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v18M12 5h6l2 2.5L18 10h-6M12 13H6l-2 2.5L6 18h6" />
        </svg>
      );
    case "press":
      // Newspaper
      return (
        <svg {...p} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 5h13v14H6a2 2 0 0 1-2-2V5ZM17 9h3v8a2 2 0 0 1-2 2M8 9h5M8 13h5M8 16h3" />
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
