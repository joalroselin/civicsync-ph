/**
 * Accessibility check (CS-105): opens key pages in light and dark mode and
 * runs axe-core. Fails on "serious" or "critical" issues.
 *
 *   node scripts/a11y.mts [baseUrl]       # default http://localhost:3000
 *
 * Uses the local Chrome (CHROME_PATH, or the usual macOS/Linux locations).
 */
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import puppeteer from "puppeteer-core";

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const chrome = [process.env.CHROME_PATH, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/google-chrome-stable"].find(
  (p) => p && existsSync(p)
);
if (!chrome) throw new Error("Chrome not found; set CHROME_PATH");
const axeSource = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

const pages = ["/", "/receipts", "/receipts?q=rice", "/bills/SBN-1294", "/bills/HB08476", "/people/01K5S6MAZ4YBST5GDJV827A0J8", "/topics", "/laws", "/data", "/changes", "/feeds", "/lawmakers", "/compare?ids=01K5S6MAZ4YBST5GDJV827A0J8,01K5ST4BN36DFQBX19ZHFDCXPM", "/how-bills-become-law", "/watchlist", "/about", "/get-involved", "/press", "/privacy", "/not-a-page"];

const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-sandbox"] });
let failures = 0;
for (const scheme of ["light", "dark"] as const) {
  for (const path of pages) {
    const page = await browser.newPage();
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: scheme }]);
    await page.evaluateOnNewDocument(() => {
      try {
        localStorage.setItem("civicsync:install-dismissed", "1");
      } catch {}
    });
    await page.goto(BASE + path, { waitUntil: "load", timeout: 60_000 });
    await new Promise((r) => setTimeout(r, 1500));
    await page.evaluate(axeSource);
    const result = await page.evaluate(async () => {
      // @ts-expect-error injected above
      const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] });
      return r.violations.map((v: any) => ({ id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.slice(0, 3).map((n: any) => n.target.join(" ")) , count: v.nodes.length }));
    });
    const bad = result.filter((v: any) => v.impact === "serious" || v.impact === "critical");
    failures += bad.length;
    const minor = result.length - bad.length;
    console.log(`${bad.length ? "✗" : "✓"} ${scheme.padEnd(5)} ${path}${minor ? `  (${minor} minor)` : ""}`);
    for (const v of bad) console.log(`    [${v.impact}] ${v.id}: ${v.help} (${v.count}×) e.g. ${v.nodes.join(" | ")}`);
    await page.close();
  }
}
await browser.close();
console.log(failures ? `\n${failures} serious issue type(s)` : "\nNo serious accessibility issues");
process.exit(failures ? 1 : 0);
