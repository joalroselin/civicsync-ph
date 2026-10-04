import { chamberPulse } from "./feed";
import { changesSince, isProgress, type StatusChange } from "./statusHistory";

const BECAME_LAW = /republic act|lapsed into law/i;

/** This week in Congress: filings, moves, new laws (last 7 days). */
export async function weeklySummary() {
  const [senate, house] = await Promise.all([chamberPulse("senate"), chamberPulse("house")]);
  const changes = changesSince(7);
  const moved = changes.filter(isProgress);
  const laws = changes.filter((c) => BECAME_LAW.test(c.to) && !BECAME_LAW.test(c.from));
  const end = new Date();
  const start = new Date(Date.now() - 6 * 864e5);
  const fmt = (d: Date) => d.toLocaleDateString("en-PH", { month: "short", day: "numeric", timeZone: "Asia/Manila" });
  return {
    range: `${fmt(start)} – ${fmt(end)}`,
    filed: (senate?.week ?? 0) + (house?.week ?? 0),
    moved: moved.length,
    laws,
    highlights: pickHighlights(moved, laws),
  };
}

/** New laws first, then furthest-along moves; one per bill. */
function pickHighlights(moved: StatusChange[], laws: StatusChange[]) {
  const rank = (c: StatusChange) => (/republic act|lapsed/i.test(c.to) ? 4 : /enrolled|bicameral|conference/i.test(c.to) ? 3 : /third reading|transmitted|approved by/i.test(c.to) ? 2 : 1);
  const seen = new Set<string>();
  return [...laws, ...moved]
    .sort((a, b) => rank(b) - rank(a) || b.date.localeCompare(a.date))
    .filter((c) => !seen.has(c.number) && seen.add(c.number))
    .slice(0, 4);
}
