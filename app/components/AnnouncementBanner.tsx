import Link from "next/link";
import { getSiteSettings } from "@/lib/content";

/** Optional site-wide banner, switched on and edited in Sanity (Site settings → Announcement). */
export async function AnnouncementBanner() {
  const { announcement } = await getSiteSettings();
  if (!announcement.enabled || !announcement.message) return null;

  const { message, linkLabel, linkUrl } = announcement;
  const internal = linkUrl?.startsWith("/");
  return (
    <div role="status" className="print:hidden bg-crimson px-4 py-2.5 text-center text-sm text-white">
      <span>{message}</span>
      {linkUrl && (
        <>
          {" "}
          {internal ? (
            <Link href={linkUrl} className="font-semibold underline underline-offset-2">
              {linkLabel || "Learn more"}
            </Link>
          ) : (
            <a href={linkUrl} target="_blank" rel="noreferrer" className="font-semibold underline underline-offset-2">
              {linkLabel || "Learn more"}
            </a>
          )}
        </>
      )}
    </div>
  );
}
