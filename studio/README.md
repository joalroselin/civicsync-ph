# CivicSync PH — Sanity Studio

The editor for CivicSync's CMS-managed copy: **Site settings** (contact
email, home search suggestions, headline numbers, announcement banner),
the **About page**, and the **Press kit** text and FAQ.

Bill and lawmaker data are *not* here; they come from Open Congress and
BatasWatch.

## First-time setup

```bash
cd studio
npm install
# studio/.env needs SANITY_STUDIO_PROJECT_ID and SANITY_STUDIO_DATASET
# (copy them from the root .env.local)
npx sanity login     # use the Google/GitHub login linked to your Sanity account
npx sanity deploy    # publishes the editor to https://civicsync.sanity.studio
```

`npm run dev` runs the editor locally at http://localhost:3333.

## How edits go live

Publishing in the Studio fires a webhook to `/api/revalidate` on the app,
which refreshes the affected pages within seconds. No redeploy is needed.
Without the webhook, pages still refresh within 5 minutes.

Singletons (one document each) have fixed IDs the app reads by:
`siteSettings`, `aboutPage`, `pressKit`. Schemas live in `schemaTypes/`.
