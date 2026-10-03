/**
 * Citations for a bill (filed legislation, not yet law). Follows the usual
 * guidance for unenacted bills in each style: the chamber is the author,
 * the bill number and Congress identify it, and the link points to the
 * official record when there is one.
 */
export interface CiteInput {
  label: string; // "SB 1294"
  chamber: "Senate" | "House";
  congress: number;
  title: string;
  dateFiled: string | null; // YYYY-MM-DD
  url: string;
}

const ord = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;
const date = (iso: string, style: "long" | "mla") => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (style === "long") return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });
  // MLA abbreviates months longer than four letters: 27 Aug. 2025, 3 June 2026
  const m = d.toLocaleDateString("en-US", { month: "long", timeZone: "UTC" });
  return `${d.getUTCDate()} ${m.length > 4 ? `${m.slice(0, 3)}.` : m} ${d.getUTCFullYear()}`;
};

export function citations(b: CiteInput, accessed: string) {
  const num = b.label.replace(/^\D+/, "");
  const senate = b.chamber === "Senate";
  const body = senate ? "Senate of the Philippines" : "House of Representatives of the Philippines";
  const billNo = `${senate ? "Senate" : "House"} Bill No. ${num}`;
  const year = b.dateFiled?.slice(0, 4) ?? "n.d.";
  const congress = `${ord(b.congress)} Congress`;

  return [
    { key: "apa", name: "APA 7", text: `${body}. (${year}). ${b.title} (${billNo}, ${congress}). ${b.url}` },
    {
      key: "mla",
      name: "MLA 9",
      text: `Philippines, Congress, ${senate ? "Senate" : "House of Representatives"}. ${b.title}. ${billNo}, ${congress}${b.dateFiled ? `, ${date(b.dateFiled, "mla")}` : ""}. ${b.url.replace(/^https?:\/\//, "")}. Accessed ${date(accessed, "mla")}.`,
    },
    {
      key: "chicago",
      name: "Chicago",
      text: `${body}. ${b.title}. ${senate ? "S." : "H."} No. ${num}, ${ord(b.congress)} Cong.${b.dateFiled ? ` Filed ${date(b.dateFiled, "long")}.` : ""} ${b.url}.`,
    },
    {
      key: "bibtex",
      name: "BibTeX",
      text: `@misc{ph-${b.label.replace(/\s+/g, "").toLowerCase()}-${b.congress},
  author       = {{${body}}},
  title        = {{${b.title}}},
  howpublished = {${billNo}, ${congress}},
  year         = {${year}},
  url          = {${b.url}},
  note         = {Accessed ${accessed}}
}`,
    },
  ];
}
