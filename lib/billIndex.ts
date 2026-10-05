import "server-only";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Our own copy of every 20th Congress bill (data/search/bills-20.json, built
 * nightly). Read from disk at runtime, never bundled for the browser.
 * - CS-306: instant title search that works even when sources are down
 * - CS-903: last-known status/title when BatasWatch is unreachable
 */
export interface IndexedBill {
  n: string; // "SBN-1294" / "HB04659"
  c: "s" | "h";
  t: string; // title
  a: string; // first author, display name
  k: number; // number of authors
  s: string; // status
  f: string | null; // filed
  p: string | null; // policy area
  o: string | null; // official record URL
}

let cache: { date: string; bills: IndexedBill[]; byNumber: Map<string, IndexedBill>; words: string[][] } | null = null;

function load() {
  if (cache) return cache;
  try {
    const json = JSON.parse(readFileSync(join(process.cwd(), "data/search/bills-20.json"), "utf8")) as { date: string; bills: IndexedBill[] };
    cache = {
      date: json.date,
      bills: json.bills,
      byNumber: new Map(json.bills.map((b) => [b.n, b])),
      words: json.bills.map((b) => tokens(`${b.t} ${b.a} ${b.n} ${b.p ?? ""}`)),
    };
  } catch {
    cache = { date: "", bills: [], byNumber: new Map(), words: [] };
  }
  return cache;
}

const tokens = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

export const indexDate = () => load().date;
export const indexedBill = (number: string) => load().byNumber.get(number) ?? null;

const STOP = new Set(["the", "of", "and", "an", "a", "act", "for", "to", "in", "on", "bill"]);

/**
 * Whole-word title/author search (last word may be a prefix, for typing).
 * Every meaningful word must match; newest first among equal scores.
 */
export function searchIndex(q: string, opts: { chamber?: "senate" | "house"; limit?: number; offset?: number } = {}) {
  const { bills, words } = load();
  const qw = tokens(q).filter((w) => !STOP.has(w));
  if (!qw.length) return { total: 0, results: [] as IndexedBill[] };
  const last = qw[qw.length - 1];
  const hits: { b: IndexedBill; score: number }[] = [];
  for (let i = 0; i < bills.length; i++) {
    const b = bills[i];
    if (opts.chamber && b.c !== (opts.chamber === "senate" ? "s" : "h")) continue;
    const ws = words[i];
    let score = 0;
    let ok = true;
    for (const w of qw) {
      const exact = ws.includes(w);
      const prefix = !exact && w === last && w.length >= 3 && ws.some((x) => x.startsWith(w));
      if (!exact && !prefix) {
        ok = false;
        break;
      }
      score += exact ? 2 : 1;
    }
    if (!ok) continue;
    // Bonus when the words appear together in the title.
    if (b.t.toLowerCase().includes(qw.join(" "))) score += 3;
    hits.push({ b, score });
  }
  hits.sort((x, y) => y.score - x.score || (y.b.f ?? "").localeCompare(x.b.f ?? ""));
  const offset = opts.offset ?? 0;
  return { total: hits.length, results: hits.slice(offset, offset + (opts.limit ?? 20)).map((h) => h.b) };
}
