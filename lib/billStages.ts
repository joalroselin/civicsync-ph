/**
 * Plain-language help for bill statuses (CS-205). Status text comes from
 * the Senate and House trackers via BatasWatch, in many wordings
 * ("PENDING IN THE COMMITTEE", "Pending with the Committee on HEALTH
 * since …"), so we match on keywords and map to the steps below.
 */
/** `body` may mark glossary terms as [[term]]; render it with GlossaryText. */
export const STAGES = [
  { short: "Filed", title: "Filed", body: "A [[senator]] or [[representative]] files the bill and it gets a number, like SB 1294 or HB 4659." },
  {
    short: "Committee",
    title: "First reading and committee",
    body: "The title is read on the [[floor]], then the bill goes to a [[committee]]. The committee studies it, may hold [[public hearings]], and decides whether to recommend it. Most bills never leave this stage.",
  },
  {
    short: "Debate",
    title: "Second reading",
    body: "The whole [[chamber]] debates the bill and votes on [[amendments]]. The [[Rules Committee]] decides when bills get [[floor time|floor]].",
  },
  {
    short: "Final vote",
    title: "Third reading",
    body: "The final vote in that chamber, usually at least three days after second reading. No more amendments are allowed.",
  },
  {
    short: "Other chamber",
    title: "The other chamber",
    body: "The bill goes to the other chamber (House or Senate), which repeats the same steps. Along the way it may change the wording, or pass its own bill on the same topic instead. Either way, each chamber now has its own [[version]], and both must match word for word before the bill can become law.",
  },
  {
    short: "Bicam",
    title: "Bicameral conference",
    body: "If the two versions differ, even slightly, a small group from each chamber meets to agree on one final text. Both chambers then [[ratify]] it.",
  },
  {
    short: "President",
    title: "The President",
    body: "The final text is sent to [[Malacañang]]. The President has 30 days to sign or [[veto]] it. If they do neither, it becomes law anyway.",
  },
  { short: "Law", title: "Republic Act", body: "The bill is now law, with a [[Republic Act]] number. It usually takes effect 15 days after [[publication]]." },
] as const;

export interface StatusHelp {
  /** Index into STAGES, or null when the bill has left the usual path. */
  stage: number | null;
  meaning: string;
}

const RULES: [RegExp, number | null, string][] = [
  [/republic act|approved by the president|lapsed into law|enacted/, 7, "This bill is now law."],
  [/veto/, 6, "The President vetoed it. Congress can override a veto with a two-thirds vote in both chambers, which is rare."],
  [/enrolled|malaca/, 6, "Both chambers passed the same text. It’s with the President, who has 30 days to sign or veto it. If they do neither, it becomes law."],
  [/bicameral|conference/, 5, "Both chambers passed versions that differ. A joint committee is working out one final text."],
  [
    /transmitted to the (senate|house)|received by the (senate|house)|approved (by the (house|senate)|on third reading)/,
    4,
    "It passed its first chamber. Now the other chamber has to pass it too.",
  ],
  [/third reading/, 3, "It’s up for the final vote in this chamber. No more amendments are allowed."],
  [/approved on second reading/, 3, "It passed second reading: debate and amendments are done. Next is the final vote (third reading)."],
  [/special order/, 2, "It’s been prioritised for floor debate (a “special order”), ahead of the usual queue."],
  [/second reading|business for/, 2, "It’s out of committee and scheduled for debate by the whole chamber."],
  [/with rules|rules committee/, 2, "The committee recommended it. The Rules Committee now decides when it reaches the floor for debate."],
  [
    /consolidated|substituted/,
    null,
    "The committee merged it with similar bills into one substitute bill. Its ideas continue there; this bill number won’t move on its own.",
  ],
  [/recommitted/, 1, "It was sent back to committee for more study."],
  [/withdrawn/, null, "The author withdrew it. It won’t move further."],
  [/archived/, null, "It wasn’t acted on before the Congress ended. Bills don’t carry over, so it would need to be filed again."],
  [/committee|referred|first reading/, 1, "It’s being studied in committee, which may hold hearings before deciding whether to recommend it. Most bills stay at this stage."],
];

export function explainStatus(status: string | null | undefined): StatusHelp | null {
  if (!status) return null;
  const s = status.toLowerCase();
  for (const [re, stage, meaning] of RULES) if (re.test(s)) return { stage, meaning };
  return null;
}
