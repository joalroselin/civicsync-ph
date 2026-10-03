/**
 * Health check for uptime monitoring (CS-902). Pings each data source;
 * 200 when all respond, 503 if any is down, with per-source detail so the
 * alert says which one. Point a free monitor (e.g. UptimeRobot, Better
 * Stack) at /api/health every 5 minutes.
 */
export const dynamic = "force-dynamic";

const CHECKS: Record<string, string> = {
  batasWatch: "https://bills.juris.ph/api/measures?sort=latest",
  openCongress: "https://open-congress-api.bettergov.ph/api/people?limit=1",
};

async function check(url: string) {
  const started = Date.now();
  try {
    const res = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
    return { ok: res.ok, status: res.status, ms: Date.now() - started };
  } catch (err) {
    return { ok: false, status: 0, ms: Date.now() - started, error: err instanceof Error ? err.name : "error" };
  }
}

export async function GET() {
  const entries = await Promise.all(Object.entries(CHECKS).map(async ([name, url]) => [name, await check(url)] as const));
  const sources = Object.fromEntries(entries);
  const ok = entries.every(([, r]) => r.ok);
  return Response.json(
    { ok, checkedAt: new Date().toISOString(), sources },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } }
  );
}
