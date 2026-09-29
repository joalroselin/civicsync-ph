# Contributing to CivicSync PH

Salamat, and thanks for helping make Philippine legislative records easier
to find and follow. Contributions of all kinds are welcome: code, design,
translations, data corrections, and ideas.

Not a developer? See **Get involved** on the site
(https://civicsync-ph-gamma.vercel.app/get-involved) for ways to help that
take a few minutes.

## Ground rules

- **Be kind.** Everyone taking part agrees to the [Code of Conduct](CODE_OF_CONDUCT.md).
- **Stay non-partisan.** CivicSync presents public records neutrally. Changes
  that favour or target any politician, party, or group won't be merged.
- **Accuracy over features.** CivicSync is a guide to the official record.
  Anything that could misstate a bill, status, or authorship needs extra care.

## Reporting a data error

If a status, author, or title looks wrong, use **Report an issue** on the
bill's page (it pre-fills an email), or open a GitHub issue with the bill
number and a link to the official Senate or House record. Note that most
data comes from [BetterGov Open Congress](https://open-congress-api.bettergov.ph)
and [BatasWatch](https://bills.juris.ph); we'll pass upstream errors along.

## Setting up the app

Requirements: Node.js 22.12 or later.

```bash
git clone https://github.com/joalroselin/civicsync-ph.git
cd civicsync-ph
npm install
cp .env.example .env.local   # optional: the app runs without any keys
npm run dev                  # http://localhost:3000
```

Without keys, the Watchlist stays on-device and CMS pages use the built-in
copy in `lib/content-defaults.ts`. See the [README](README.md) for how the data
sources, CMS, and caching fit together.

## Making a change

1. **Open an issue first** for anything bigger than a small fix, so we can
   agree on the approach before you spend time on it.
2. Create a branch from `main`.
3. Keep changes focused, and match the style of the surrounding code.
4. Before opening a pull request, make sure these pass:
   ```bash
   npx tsc --noEmit
   npm run build
   ```
5. Check your change on a phone-sized screen as well as desktop. Most users
   are on mobile.
6. Open a pull request describing what changed and why, with screenshots for
   visual changes.

## Licence and the Contributor License Agreement

CivicSync PH is open source under the [GNU Affero General Public License
v3.0 or later](LICENSE), and it also offers [commercial
licences](COMMERCIAL-LICENSE.md) to organisations that can't meet the AGPL's
terms. Commercial licences help fund the project.

To make that possible, contributors sign a short **[Contributor License
Agreement](CLA.md)** (CLA) before their first pull request is merged. You
keep the copyright in your work; the CLA lets the project offer your
contribution under both the AGPL and commercial licences. A bot will prompt
you on your first pull request, and signing takes one click.

## Questions

Email hello.joaldev@gmail.com (subject: "Contribute: CivicSync PH").
