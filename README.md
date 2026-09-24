# CivicSync PH

Receipts and a Civic Watchlist for Philippine legislation. Mobile-first PWA
built on Next.js 14 (App Router), Tailwind, and Firebase. See the public
roadmap for scope and phasing.

## Features (v1)

- **Receipts** — search a lawmaker, a bill title/topic, or a bill number
  ("SB 1294", "HB 4659") and see every bill they've authored across all
  13 congresses on record.
- **Bill detail** — authors, live status and committee (20th Congress),
  plain-language summary, and links to the official record.
- **Watchlist** — bookmark bills; statuses refresh each time you open it.
  Stored on-device, synced to Firestore when signed in with Google.
- **PWA** — installable, with offline access to pages you've visited.
  No push notifications in v1 (see the roadmap).

## Setup

```bash
npm install
cp .env.example .env.local   # optional — Firebase keys for Watchlist sync
npm run dev
```

Without Firebase keys the app works fully; the Watchlist just stays on the
device and the Sign in button is hidden. To enable sync, fill in
`.env.local` and deploy `firestore.rules` to your Firebase project.

The service worker only registers in production (`npm run build && npm start`).

## Data sources

| Source | Provides | Coverage |
|---|---|---|
| [BetterGov Open Congress](https://open-congress-api.bettergov.ph) (`lib/openCongress.ts`) | Lawmaker profiles, authorship, bill history | 13th–20th Congress, **but its catalogue currently stops around Sept 2025** |
| [BatasWatch](https://bills.juris.ph/api) (`lib/batasWatch.ts`) | Live status, committee, summaries, and all 20th Congress bills filed since | 20th Congress only |

`lib/bills.ts` merges the two. 20th Congress bills are addressed by their
BatasWatch number (`/bills/SBN-1294`, `/bills/HB04659`) so each bill has one
URL and one Watchlist entry; older bills use their Open Congress ID.

**Accepted v1 risk:** because of the Open Congress lag, BatasWatch — an
independent, unauthenticated source — is the *only* source for the home
feed, bills filed since Sept 2025, and the live tab on lawmaker pages. If
it's down, those spots show a "temporarily unavailable" notice
(`app/components/LiveDataUnavailable.tsx`) and everything backed by Open
Congress keeps working. Revisit if it proves unreliable, or if Open Congress
catches up.

Upstream quirks handled in code (verified against live responses, Sept 2026):

- BatasWatch returns `{ items, meta }`; its `q` search is fuzzy, so bill
  lookups match `number` exactly. Numbers: Senate `SBN-1294`, House `HB04659`.
- BatasWatch has no author filter; lawmaker pages search by surname and
  filter on `authorCredits` (surname + given name/alias) to separate
  lawmakers who share a surname.
- Open Congress full-text search doesn't match bill numbers; "SB 1294" is
  parsed into `q=1294&subtype=SB`.
- Open Congress has duplicate person records for some lawmakers; search
  results are de-duplicated by name.

## Architecture

- Pages (`app/**/page.tsx`) are server components that call `lib/` directly.
- `app/api/bills` and `app/api/bills/[id]` expose the same data as JSON for
  client code — currently the Watchlist's status refresh.
- Upstream responses are cached by Next's fetch cache (Open Congress 1h,
  BatasWatch 30m).
- `public/sw.js` — hand-written service worker: cache-first for static
  assets, network-first for pages and API calls, `/offline` fallback.

## Next steps

1. Set up the Firebase project (Google sign-in + Firestore) and deploy
   `firestore.rules`.
2. Match screens to the design canvas.
3. Deploy (Vercel).
4. Lazy-load Firebase so it isn't in every page's bundle (~110 kB).
5. Tests for bill-number parsing, number mapping, and author matching.
