import { createClient, type SanityClient } from "@sanity/client";

/**
 * Read-only Sanity client for CMS-managed copy (About, Press, site settings).
 * Content is edited in Sanity Studio (studio/) and goes live without a deploy:
 * responses are cached under CONTENT_TAG, which the publish webhook
 * (app/api/revalidate) clears. REVALIDATE_SECONDS is a safety net if the
 * webhook isn't set up or misses an event.
 */
export const CONTENT_TAG = "sanity-content";
const REVALIDATE_SECONDS = 300;

const projectId = process.env.SANITY_API_PROJECT_ID ?? process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
const dataset = process.env.SANITY_API_DATASET ?? process.env.NEXT_PUBLIC_SANITY_DATASET ?? "production";

const client: SanityClient | null = projectId
  ? createClient({
      projectId,
      dataset,
      apiVersion: "2025-01-01",
      useCdn: false, // tag revalidation needs fresh reads, not the CDN's copy
      token: process.env.SANITY_API_READ_TOKEN, // server-only; works for public or private datasets
      perspective: "published",
    })
  : null;

/** Returns null (never throws) if Sanity isn't configured or can't be reached. */
export async function sanityFetch<T>(query: string, params: Record<string, unknown> = {}): Promise<T | null> {
  if (!client) return null;
  try {
    return await client.fetch<T>(query, params, {
      next: { revalidate: REVALIDATE_SECONDS, tags: [CONTENT_TAG] },
    });
  } catch (err) {
    console.error("Sanity fetch failed; using default content", err);
    return null;
  }
}
