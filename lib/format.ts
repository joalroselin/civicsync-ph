export function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" });
}

/** Tagalog greeting keyed to Manila time. */
export function greeting(date = new Date()) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: "Asia/Manila" }).format(date)
  );
  if (hour < 12) return "Magandang umaga!";
  if (hour < 13) return "Magandang tanghali!";
  if (hour < 18) return "Magandang hapon!";
  return "Magandang gabi!";
}

export function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Upstream titles are often ALL CAPS — soften them for reading. */
/** Cyrillic letters that look Latin (seen in some upstream titles, e.g. "ACТ" with a Cyrillic Т). */
const HOMOGLYPHS: Record<string, string> = {
  А: "A", В: "B", Е: "E", К: "K", М: "M", Н: "H", О: "O", Р: "P", С: "C", Т: "T", Х: "X", У: "Y",
  а: "a", е: "e", о: "o", р: "p", с: "c", у: "y", х: "x", т: "t", к: "k", м: "m", н: "h", в: "b",
};
export function fixHomoglyphs(s: string) {
  // Only touch text that is otherwise Latin, so genuine Cyrillic stays intact.
  if (!/[A-Za-z]/.test(s)) return s;
  return s.replace(/[\u0400-\u04FF]/g, (c) => HOMOGLYPHS[c] ?? c);
}

export function toTitleCase(input: string) {
  const s = fixHomoglyphs(input);
  // Treat as shouting if most letters are capitals (some titles have a stray lowercase "Inc." or similar).
  const letters = s.match(/\p{L}/gu) ?? [];
  const upper = letters.filter((c) => c !== c.toLowerCase()).length;
  if (!letters.length || upper / letters.length < 0.8) return s;
  const small = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with", "into", "from"]);
  return s
    .toLowerCase()
    .split(" ")
    .map((w, i) => {
      if (i > 0 && small.has(w)) return w;
      if (/^([a-z]\.){2,}$/.test(w)) return w.toUpperCase();
      if (/^(ra|hb|sb|ofw|ofws|lgu|lgus|dole|doh|deped|ched|dswd|nbi|pnp|afp|bsp|sss|gsis|vat|bir|ii|iii|iv)$/.test(w.replace(/[^a-z.]/g, "")))
        return w.toUpperCase();
      return w.replace(/(^|[-(/"])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
    })
    .join(" ");
}

/**
 * A representative's seat, readable without context. Districts already say
 * so ("Manila, 6th District"); party-list groups are just a name ("4Ps",
 * "TINGOG"), which can be mistaken for a programme, so label them.
 */
export function seatLabel(representation: string | null | undefined): string | null {
  if (!representation) return null;
  if (/district/i.test(representation)) return representation;
  const name = representation.replace(/\s*party[\s-]?list$/i, "").trim();
  return `${name} (party-list)`;
}
