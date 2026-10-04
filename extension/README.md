# CivicSync PH browser extension (CS-115)

Shows the live status of Philippine bills wherever you read about them. Hover
"SB 1294", "Senate Bill No. 1294" or "H.B. 4659" on any page.

- Only the bill number is sent to CivicSync (`/api/status/{number}`), never
  the page or its address. No accounts, no tracking.
- Numbers are looked up in the current (20th) Congress; the tooltip says so.

## Try it (Chrome, Edge, Brave)
1. Open `chrome://extensions`, turn on **Developer mode**.
2. **Load unpacked** → choose this `extension/` folder.
3. Open a news article that mentions a bill and hover the number.

## Publish
Zip this folder (`npm run extension:zip`) and upload it to the Chrome Web
Store developer dashboard (one-time US$5 registration). Firefox: the same
files work as a Firefox add-on via addons.mozilla.org.
