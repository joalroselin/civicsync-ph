/**
 * Smoke test against a running CivicSync (local `next start` in CI, or a
 * deployed URL):  node scripts/smoke.mts http://localhost:3000
 *
 * Checks that key pages and endpoints respond with what they should.
 * Upstream data sources can be down, so pages only need to render, not
 * contain live data.
 */
const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");

const checks: { path: string; status?: number[]; contains?: string; type?: string }[] = [
  { path: "/", contains: "Latest from Congress" },
  { path: "/receipts?q=rice", contains: "Receipts" },
  { path: "/bills/SBN-1294", contains: "SB 1294" },
  { path: "/how-bills-become-law", contains: "How a bill becomes law" },
  { path: "/privacy", contains: "Privacy first" },
  { path: "/about", contains: "About" },
  { path: "/get-involved", contains: "Get involved" },
  { path: "/press", contains: "Press" },
  { path: "/watchlist", contains: "Watchlist" },
  { path: "/sitemap.xml", contains: "<urlset", type: "xml" },
  { path: "/robots.txt", contains: "Sitemap:" },
  { path: "/embed/bill/SBN-1294", status: [200, 404], type: "text/html" },
  { path: "/embed/bill/SBN-1294/badge.svg", status: [200, 404], type: "image/svg+xml" },
  { path: "/api/health", status: [200, 503], contains: "\"sources\"" },
  { path: "/manifest.json", contains: "CivicSync" },
  { path: "/this-page-does-not-exist", status: [404] },
];

let failed = 0;
for (const c of checks) {
  const want = c.status ?? [200];
  try {
    const res = await fetch(BASE + c.path, { signal: AbortSignal.timeout(30_000) });
    const body = await res.text();
    const problems = [
      !want.includes(res.status) && `status ${res.status}, wanted ${want.join("/")}`,
      c.contains && res.status === 200 && !body.includes(c.contains) && `missing "${c.contains}"`,
      // The app's error page renders with status 200, so check the text too.
      res.status === 200 && body.includes("Something went wrong") && "shows the error page",
      c.type && res.status === 200 && !(res.headers.get("content-type") ?? "").includes(c.type) && `content-type ${res.headers.get("content-type")}`,
    ].filter(Boolean);
    if (problems.length) failed++;
    console.log(`${problems.length ? "✗" : "✓"} ${c.path}${problems.length ? `: ${problems.join("; ")}` : ""}`);
  } catch (err) {
    failed++;
    console.log(`✗ ${c.path}: ${(err as Error).message}`);
  }
}
console.log(failed ? `\n${failed} check(s) failed` : `\nAll ${checks.length} checks passed`);
process.exit(failed ? 1 : 0);
