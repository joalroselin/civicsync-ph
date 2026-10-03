/**
 * Matching a BatasWatch author ("TULFO, ERWIN T.", House code "L055") to an
 * Open Congress person. Pure functions, shared by the site (lib/authorIndex)
 * and the nightly data job (scripts/build-lawmakers.mts).
 */
export interface MatchPerson {
  id: string;
  first_name: string | null;
  last_name: string | null;
  aliases?: string[] | null;
  congress_website_author_keys?: string[] | null;
}

const SUFFIX = /^(JR|SR|II|III|IV|V)\.?$/;
const tokens = (s: string) =>
  s
    .toUpperCase()
    .replace(/[-.,]/g, " ")
    .split(/\s+/)
    .filter((t) => t && !SUFFIX.test(t));

/** "SOTTO III, VICENTE C." → { surname: ["SOTTO"], given: ["VICENTE"], nick: [] } */
export function parseCanonical(canonical: string) {
  const [last, first = ""] = canonical.split(",");
  const nick = [...first.matchAll(/"([^"]+)"/g)].map((m) => m[1].toUpperCase());
  return {
    surname: tokens(last),
    given: tokens(first.replace(/"[^"]*"/g, " ")).filter((g) => g.length > 1),
    nick,
  };
}

/**
 * Best name match, or null when there's no clear winner. Surname must match
 * (hyphens/spaces/suffixes ignored); then the most given names or
 * nicknames in common wins. Duplicate records of one person count as one.
 */
export function matchByName<T extends MatchPerson>(canonical: string, people: T[]): T | null {
  const { surname, given, nick } = parseCanonical(canonical);
  const want = surname.join(" ");
  const scored = people
    .map((p) => {
      const last = tokens(p.last_name ?? "").join(" ");
      if (last !== want && !last.split(" ").includes(want)) return null;
      const names = new Set([...tokens(p.first_name ?? ""), ...(p.aliases ?? []).map((a) => a.toUpperCase())]);
      const score = given.filter((g) => names.has(g)).length + nick.filter((n) => names.has(n)).length * 2;
      return score > 0 ? { p, score } : null;
    })
    .filter((x): x is { p: T; score: number } => x !== null)
    .sort((a, b) => b.score - a.score);
  if (!scored.length) return null;
  const top = scored.filter((s) => s.score === scored[0].score);
  const fullName = (p: MatchPerson) => `${tokens(p.first_name ?? "").join(" ")}|${tokens(p.last_name ?? "").join(" ")}`;
  // Ties are fine only if they're the same person recorded twice.
  return new Set(top.map((s) => fullName(s.p))).size === 1 ? top[0].p : null;
}
