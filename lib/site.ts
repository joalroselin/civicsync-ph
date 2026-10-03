import { SITE_HOST } from "./og";

export const SITE_URL = `https://${SITE_HOST}`;

/**
 * Tag links that leave our own pages (widgets, badges, social bios) so
 * analytics can tell which channel sent the visit. No personal data.
 */
export function withUtm(path: string, source: string, medium: string, campaign: string) {
  const url = new URL(path, SITE_URL);
  url.searchParams.set("utm_source", source);
  url.searchParams.set("utm_medium", medium);
  url.searchParams.set("utm_campaign", campaign);
  return url.toString();
}
