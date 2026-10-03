import type { OpenCongressPerson } from "./openCongress";

/**
 * True when every word typed starts one of the lawmaker's names, so
 * "rice" doesn't match "Erice" or "Gorriceta", but "hont", "risa
 * hontiveros" and "Kiko" (an alias) do.
 */
export function nameMatches(p: OpenCongressPerson, q: string): boolean {
  const tokens = [p.first_name, p.last_name, p.middle_name, ...(p.aliases ?? [])]
    .filter(Boolean)
    .flatMap((n) => n!.toLowerCase().split(/[\s\-.,"]+/))
    .filter(Boolean);
  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((w) => tokens.some((t) => t.startsWith(w)));
}

/** Words worth highlighting in titles: skip tiny or filler words. */
export function highlightTerms(q: string): string[] {
  const skip = new Set(["the", "and", "for", "of", "act", "bill", "an", "a", "to", "on", "in"]);
  return q
    .toLowerCase()
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}-]/gu, ""))
    .filter((w) => w.length > 2 && !skip.has(w));
}
