/**
 * One-time seed: copies lib/content-defaults.ts into Sanity.
 *
 *   node --env-file=.env.local scripts/seed-content.mts
 *
 * Uses createIfNotExists, so re-running never overwrites edits made in the
 * Studio. Needs SANITY_API_WRITE_TOKEN (server-side secret from Vercel).
 */
import { createClient } from "@sanity/client";
import { DEFAULT_ABOUT_PAGE, DEFAULT_GET_INVOLVED_PAGE, DEFAULT_PRESS_KIT, DEFAULT_SITE_SETTINGS } from "../lib/content-defaults.ts";

const projectId = process.env.SANITY_API_PROJECT_ID;
const token = process.env.SANITY_API_WRITE_TOKEN;
if (!projectId || !token) {
  console.error("Missing SANITY_API_PROJECT_ID or SANITY_API_WRITE_TOKEN (run with --env-file=.env.local).");
  process.exit(1);
}

const client = createClient({
  projectId,
  dataset: process.env.SANITY_API_DATASET ?? "production",
  apiVersion: "2025-01-01",
  token,
  useCdn: false,
});

const docs = [
  { _id: "siteSettings", _type: "siteSettings", ...DEFAULT_SITE_SETTINGS },
  { _id: "aboutPage", _type: "aboutPage", ...DEFAULT_ABOUT_PAGE },
  { _id: "getInvolvedPage", _type: "getInvolvedPage", ...DEFAULT_GET_INVOLVED_PAGE },
  { _id: "pressKit", _type: "pressKit", ...DEFAULT_PRESS_KIT },
];

const tx = client.transaction();
for (const doc of docs) tx.createIfNotExists(doc);
const res = await tx.commit({ visibility: "sync" });

for (const doc of docs) {
  const created = res.results.some((r) => r.id === doc._id && r.operation === "create");
  console.log(`${doc._id}: ${created ? "created" : "already exists (left unchanged)"}`);
}
