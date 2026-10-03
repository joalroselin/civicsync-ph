/**
 * Short definitions for civic terms, shown on hover or tap. In text, mark
 * a term as [[term]] or [[shown text|term]]; see GlossaryText.
 */
export const GLOSSARY: Record<string, string> = {
  senator: "One of 24 members of the Senate, elected nationwide for six-year terms.",
  representative: "A member of the House, elected by a district or a party-list group for three-year terms.",
  chamber: "One of the two houses of Congress: the Senate or the House of Representatives. A bill must pass both.",
  floor: "The full chamber in session, where all members can debate and vote, as opposed to a smaller committee.",
  committee: "A smaller group of members focused on one area, like Health or Agriculture. It studies bills before the full chamber sees them.",
  "public hearings": "Committee meetings where experts, agencies and citizens give their views on a bill. Most are open to the public and streamed.",
  amendments: "Proposed changes to a bill’s wording, voted on before the bill is approved.",
  "rules committee": "The committee that sets each chamber’s agenda, deciding which bills reach the floor and when.",
  version: "Each chamber passes its own text of a bill, which may differ from the other’s.",
  ratify: "A final vote by each chamber approving the text agreed on in the bicameral conference.",
  "malacañang": "The official home and office of the President, often used to mean the President’s office.",
  veto: "The President’s rejection of a bill. Congress can override it with a two-thirds vote in both chambers.",
  "republic act": "The official name for a national law, numbered in order, like Republic Act No. 11313.",
  publication: "A law takes effect only after it’s printed in the Official Gazette or a national newspaper.",
  consolidated: "Several similar bills combined into one by a committee.",
  "substitute bill": "The new bill a committee writes to replace the bills it combined. It gets its own number.",
  congress: "One three-year term of the legislature, numbered in order. The 20th Congress runs from 2025 to 2028.",
  "local or private bills": "Bills that affect one place (like renaming a road) or one person or group, rather than the whole country.",
};

export function lookupTerm(term: string): string | undefined {
  return GLOSSARY[term.toLowerCase()];
}
