# CivicSync PH open data

Rebuilt every night (02:30 Manila) by `.github/workflows/lawmakers-data.yml`.
Every night's version is in this repository's git history. Browse it at
https://civicsync-ph-gamma.vercel.app/data.

| File | What it is |
|---|---|
| `search/bills-20.json` | Every 20th Congress bill: number, chamber, title, first author, author count, status, filing date, topic, official record link |
| `status/latest.json` | Every bill's status at the last check |
| `status/changes.json` | Status changes from the last 120 days, newest first |
| `status/archive/YYYY-MM.json` | Every status change, by month, since 2026-10-04 |
| `lawmakers.json` | Every current senator and representative: bills per congress, bills that became law this Congress, top topics, frequent co-authors, committees their bills go to |
| `laws.json` | Every 20th Congress Republic Act: signed text link, effectivity, and the IRR agency and deadline read from the law (OCR, so check the text) |

## Fields

`search/bills-20.json` → `{ date, bills: [{ n, c, t, a, k, s, f, p, o }] }`:
`n` number (`SBN-1294`, `HB04659`), `c` chamber (`s`/`h`), `t` title,
`a` first author, `k` number of authors, `s` status, `f` filed (YYYY-MM-DD),
`p` policy area, `o` official record URL.

`status/changes.json` → `{ since, updated, changes: [{ date, number, chamber, title, from, to }] }`.

## Sources and licence

Compiled from public legislative records via **BetterGov Open Congress**
(open-congress-api.bettergov.ph) and **BatasWatch** (bills.juris.ph), which
link to the official Senate and House records. Our compilation is shared
under **CC BY 4.0**: use it freely, credit "CivicSync PH" and the sources
above. Automated fields (topics, IRR deadlines) can be wrong; verify against
the official record before citing.
