# CivicSync PH — Development Roadmap

_Last updated: 24 Sept 2026 · Live at https://civicsync-ph-gamma.vercel.app_

This picks up where the original public roadmap's v1 scope left off. Phases
are named rather than numbered so they don't collide with that document's
versioning; fold them in when the two are merged.

## Where things stand

**Shipped (v1):**

- **Receipts:** search lawmakers, bill titles/topics and bill numbers across
  13 congresses (8th–20th, 1987–present).
- **Bill detail:** authors, live status and committee (20th Congress), plain-language
  summary, official sources.
- **Watchlist:** on-device by default, optional Google sign-in with Firestore
  sync; statuses refresh when opened.
- **PWA:** installable, offline fallback, responsive from phone to desktop.
- **Live data unavailable notices** when BatasWatch is down.

**Known constraints carried into this roadmap:**

| Constraint | Impact | Where it's addressed |
|---|---|---|
| Open Congress's catalogue stops around Sept 2025 | BatasWatch is the only source for newer bills | Phase 1 (outreach), Phase 4 (own data layer) |
| BatasWatch is independent, unauthenticated, 20th Congress only | Single point of failure for live features (accepted for v1) | Phase 1 (monitoring), Phase 4 |
| Open Congress full-text search takes ~5s uncached | Slow first searches (currently streamed behind a skeleton) | Phase 4 (own search index) |
| Server runs in Washington DC (`iad1`) | Extra latency for Philippine users | Phase 1 |
| Firebase SDK ships in every page (~110 kB) | Heavier first load on mobile data | Phase 1 |

---

## Phase 1: Harden (next 2–4 weeks)

Make what exists fast, reliable and safe to promote.

- [ ] **Run the server in Singapore.** Pin the function region to `sin1` in a
      committed `vercel.json` so it can't drift from the dashboard setting.
- [ ] **Lazy-load Firebase.** Load auth/Firestore only when someone opens the
      Watchlist or signs in.
- [ ] **Tests + CI.** Unit tests for bill-number parsing, SB/HB number mapping,
      author matching (shared surnames) and the source merge; GitHub Actions
      running typecheck, tests and build on every PR.
- [ ] **Link previews.** Open Graph images for bill and lawmaker pages, so
      links shared on Facebook/Messenger/X show the title and status
      (the main way civic content spreads in PH).
- [ ] **Custom domain** (e.g. `civicsync.ph`), then update the Firebase
      authorized domains, social posts and manifest.
- [ ] **Monitoring.** Vercel Analytics (privacy-friendly), error tracking, and
      an uptime check on BatasWatch so outages are known before users report them.
- [ ] **Accessibility pass.** WCAG 2.1 AA: contrast, focus order, screen-reader
      labels on status chips, 44px touch targets.
- [ ] **Data-source outreach.** Ask BetterGov when Open Congress will cover
      bills after Sept 2025; introduce the project to BatasWatch's maintainer.

**Done when:** p75 page load under 2.5s on 4G in Manila, CI green on `main`,
share links show rich previews.

## Phase 2: Engage (1–2 months)

Give people a reason to come back.

- [ ] **Status-change notifications.** This is the biggest v1 gap.
  - A scheduled job (Vercel Cron, daily) compares each watched bill's status
    with the last snapshot.
  - Changes go out as web push (FCM), with an opt-in email digest as the
    fallback: iOS only allows push for installed PWAs.
  - Needs server-side access to Watchlists (Firestore Admin), so update
    `firestore.rules` and the privacy note.
- [ ] **Filipino / Tagalog language toggle.** i18n for all UI copy; English
      bill titles stay as filed.
- [ ] **Dark mode.**
- [ ] **Shareable bill and lawmaker cards.** One-tap image export in the same
      style as the Instagram posts.
- [ ] **Onboarding.** A short first-visit explainer of Receipts, status and
      Watchlist, plus "what does 'Pending Second Reading' mean?" help text.
- [ ] **Privacy page.** What's stored on-device and in Firestore, and that
      there's no tracking beyond aggregate analytics.

**Done when:** a user can get notified the day a watched bill moves.

## Phase 3: Depth (2–4 months)

Go from lookup tool to understanding tool.

- [ ] **Browse by topic.** Policy areas from BatasWatch analysis (e.g. Social
      Welfare, Agriculture) as browsable sections and search filters.
- [ ] **Richer lawmaker profiles.**
  - Portraits (BatasWatch provides public-domain portraits with attribution).
  - Committee memberships and district/party, where a source exists.
  - Frequent co-authors.
- [ ] **Bill timelines.** A history of status changes over time. This needs
      the snapshots from Phase 2's job, so start storing them early.
- [ ] **Compare lawmakers.** Side-by-side counts by congress, topic and status.
- [ ] **Enacted laws.** Link bills that became Republic Acts to the RA text.
- [ ] **Research: voting records.** Not available from either current source;
      investigate the official journals/records of both chambers.

## Phase 4: Own the data (ongoing, starts in parallel with Phase 3)

Remove the live dependency on third-party APIs.

- [ ] **Nightly ingest** of Open Congress and BatasWatch into our own
      database (Postgres via Vercel Marketplace, or Firestore), with a
      provenance field on every record.
- [ ] **Own search index.** Fast full-text and bill-number search, replacing
      the ~5s upstream search.
- [ ] **Fallback source.** Scrape the official Senate/House listings for
      status when BatasWatch is unavailable. This is brittle, so treat it as a
      backup, not the primary source.
- [ ] **Public API/dataset (stretch).** Give back cleaned, merged data to other
      civic-tech projects under an open licence.

---

## Decisions log

| Date | Decision | Why |
|---|---|---|
| Sept 2026 | Use BatasWatch as the source for 20th Congress bills filed after Sept 2025 | Open Congress lags a year; accepted risk for v1 with a visible outage notice |
| Sept 2026 | Address 20th Congress bills by BatasWatch number (`/bills/SBN-1294`) | Gives one URL and one Watchlist entry whichever source surfaced the bill |
| Sept 2026 | Watchlist works without an account; sign-in only for sync | Lower barrier; no personal data unless the user opts in |
| Sept 2026 | Show BatasWatch's automated summaries, labelled as automated | Useful context; the label and "read the bill text" note limit misreading |

## How we'll measure it

- Weekly active users and returning visitors
- Searches per visit, and share of searches that return results
- Watchlist adds; notification opt-in rate (Phase 2+)
- PWA installs
- BatasWatch availability and p75 page load time

## Open questions

- Merge with the original public roadmap: which items there aren't reflected here?
- Monetisation or sustainability: grants (civic-tech funds), donations, or
  keep it a free public good?
- Moderation/neutrality policy for any user-facing commentary (currently none).
