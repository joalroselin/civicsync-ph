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
export function toTitleCase(s: string) {
  if (s !== s.toUpperCase()) return s;
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
