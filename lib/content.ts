import { sanityFetch } from "@/lib/sanity";
import {
  DEFAULT_ABOUT_PAGE,
  DEFAULT_PRESS_KIT,
  DEFAULT_SITE_SETTINGS,
  type AboutPage,
  type PressKit,
  type SiteSettings,
} from "@/lib/content-defaults";

export type { AboutPage, PressKit, SiteSettings };

/** Overlay non-empty CMS values on the defaults, one level deep. */
function withDefaults<T extends object>(defaults: T, cms: Partial<T> | null): T {
  if (!cms) return defaults;
  const out = { ...defaults } as Record<string, unknown>;
  for (const [k, v] of Object.entries(cms)) {
    if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    const base = (defaults as Record<string, unknown>)[k];
    out[k] =
      typeof v === "object" && !Array.isArray(v) && base && typeof base === "object" && !Array.isArray(base)
        ? { ...base, ...Object.fromEntries(Object.entries(v).filter(([, x]) => x !== null && x !== undefined && x !== "")) }
        : v;
  }
  return out as T;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const cms = await sanityFetch<Partial<SiteSettings>>(
    `*[_id == "siteSettings"][0]{ contactEmail, homeSuggestions, stats, announcement }`
  );
  return withDefaults(DEFAULT_SITE_SETTINGS, cms);
}

export async function getAboutPage(): Promise<AboutPage> {
  const cms = await sanityFetch<Partial<AboutPage>>(`*[_id == "aboutPage"][0]{ title, intro, body }`);
  return withDefaults(DEFAULT_ABOUT_PAGE, cms);
}

export async function getPressKit(): Promise<PressKit> {
  const cms = await sanityFetch<Partial<PressKit>>(`*[_id == "pressKit"][0]{ oneLine, short, long, faq }`);
  return withDefaults(DEFAULT_PRESS_KIT, cms);
}
