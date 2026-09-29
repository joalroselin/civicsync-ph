/**
 * Default copy for CMS-managed content.
 *
 * Two jobs:
 * 1. Seed data: scripts/seed-content.mts copies these into Sanity once.
 * 2. Fallback: pages render these if Sanity is unreachable or a field is
 *    empty, so the site never shows blank sections.
 *
 * After seeding, edit content in Sanity Studio, not here. Keep this file free
 * of path aliases so the seed script can import it directly with Node.
 */

export interface PortableSpan {
  _type: "span";
  _key: string;
  text: string;
  marks: string[];
}
export interface PortableBlock {
  _type: "block";
  _key: string;
  style: "normal" | "h2" | "h3";
  listItem?: "bullet" | "number";
  level?: number;
  markDefs: { _type: "link"; _key: string; href: string }[];
  children: PortableSpan[];
}

export interface SiteSettings {
  contactEmail: string;
  homeSuggestions: string[];
  stats: { currentCongressBills: string; totalRecords: string; asOf: string };
  announcement: { enabled: boolean; message: string; linkLabel?: string; linkUrl?: string };
}
export interface AboutPage {
  title: string;
  intro: string;
  body: PortableBlock[];
}
export interface PressKit {
  oneLine: string;
  short: string;
  long: string;
  faq: { _key: string; question: string; answer: string }[];
}

const REPO_URL = "https://github.com/joalroselin/civicsync-ph";

// --- tiny Portable Text builders -------------------------------------------
type Segment = string | { text: string; href?: string; strong?: boolean };
let keySeq = 0;
const key = () => `k${(++keySeq).toString(36)}`;

function block(style: PortableBlock["style"], segments: Segment[], listItem?: "bullet"): PortableBlock {
  const markDefs: PortableBlock["markDefs"] = [];
  const children = segments.map((seg): PortableSpan => {
    if (typeof seg === "string") return { _type: "span", _key: key(), text: seg, marks: [] };
    const marks: string[] = [];
    if (seg.strong) marks.push("strong");
    if (seg.href) {
      const linkKey = key();
      markDefs.push({ _type: "link", _key: linkKey, href: seg.href });
      marks.push(linkKey);
    }
    return { _type: "span", _key: key(), text: seg.text, marks };
  });
  return { _type: "block", _key: key(), style, markDefs, children, ...(listItem ? { listItem, level: 1 } : {}) };
}
const h2 = (text: string) => block("h2", [text]);
const p = (...segments: Segment[]) => block("normal", segments);
const li = (...segments: Segment[]) => block("normal", segments, "bullet");

// --- defaults ---------------------------------------------------------------

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  contactEmail: "",
  homeSuggestions: ["Hontiveros", "Tulfo", "Magna Carta", "SB 1294", "rice"],
  stats: { currentCongressBills: "13,600+", totalRecords: "165,000+", asOf: "2026-09-24" },
  announcement: { enabled: false, message: "" },
};

export const DEFAULT_ABOUT_PAGE: AboutPage = {
  title: "About CivicSync PH",
  intro:
    "CivicSync PH helps Filipinos find and follow the work of their lawmakers: every bill they file, where it stands, and what it’s about.",
  body: [
    h2("Why we built it"),
    p(
      "The Philippine Congress has two chambers: a 24-member Senate elected nationwide and a House of Representatives with more than 300 members. Each three-year Congress sees thousands of bills filed. All of this is public record, but it’s spread across two separate chamber websites, each with its own formats and numbering, built mainly for desktop. Most Filipinos get online through their phones."
    ),
    p("CivicSync brings those records together in one place that’s easy to search on any device."),
    h2("What you can do"),
    li({ text: "Check a lawmaker’s record.", strong: true }, " See every bill a senator or representative has authored, across both chambers and 13 congresses back to 1987."),
    li({ text: "Search both chambers at once.", strong: true }, " Type a keyword or a bill number however you like: “SB 1294”, “hb4659”, or a topic."),
    li({ text: "See where a bill is now.", strong: true }, " Current status, the committee it’s in, and a plain-language summary, with links to the official record."),
    li({ text: "Follow bills you care about.", strong: true }, " Bookmark them to your Watchlist. No account needed."),
    h2("Where the data comes from"),
    p(
      "CivicSync is built on open civic data. Lawmaker profiles and authorship history come from ",
      { text: "BetterGov’s Open Congress API", href: "https://open-congress-api.bettergov.ph" },
      ". Live status, committee referrals, plain-language summaries, and recent 20th Congress bills come from ",
      { text: "BatasWatch", href: "https://bills.juris.ph" },
      ", an independent bill tracker. The summaries are automated and labelled as such."
    ),
    h2("What CivicSync is not"),
    p(
      "CivicSync is independent and non-partisan, and is not affiliated with the Senate, the House of Representatives, or any government agency. It’s a guide to the official record, not a replacement for it. Always verify important details at ",
      { text: "senate.gov.ph", href: "https://senate.gov.ph" },
      " and ",
      { text: "congress.gov.ph", href: "https://www.congress.gov.ph" },
      "."
    ),
    h2("Who’s behind it"),
    p(
      "CivicSync PH is built by HelloJoal, an independent developer, with AI assistance. The source code is public on ",
      { text: "GitHub", href: REPO_URL },
      "."
    ),
    h2("Help shape it"),
    p(
      "CivicSync is free and still growing. Have an idea or spotted a problem? ",
      { text: "Open an issue on GitHub", href: `${REPO_URL}/issues` },
      ". Journalists can find logos, screenshots, and a fact sheet in the ",
      { text: "press kit", href: "/press" },
      "."
    ),
  ],
};

export const DEFAULT_PRESS_KIT: PressKit = {
  oneLine: "CivicSync PH is a free app for looking up Philippine lawmakers and the bills they file.",
  short:
    "CivicSync PH is a free, mobile-first web app that makes Philippine legislative records easier to use. Search the Senate and House of Representatives in one place, see every bill a lawmaker has authored across 13 congresses since 1987, check where a bill stands today, and follow the bills you care about. No sign-up required.",
  long:
    "CivicSync PH is a free, mobile-first web app that helps Filipinos find and follow the work of their lawmakers. The Philippine Congress has two chambers, each with its own website, formats, and numbering, and each three-year Congress sees thousands of bills filed. CivicSync brings those records together: one search across the Senate and House, one profile per lawmaker covering their whole career across both chambers, and one page per bill combining its history with its current status, committee, a plain-language summary, and links to the official record. Users can bookmark bills to a Watchlist without creating an account. CivicSync is built on open data from BetterGov's Open Congress API and BatasWatch, and is designed as a guide to the official record, not a replacement for it. It was built by independent developer HelloJoal, with AI assistance, and its source code is public.",
  faq: [
    {
      _key: "faq-official",
      question: "Is CivicSync an official government website?",
      answer:
        "No. CivicSync is independent and non-partisan, and is not affiliated with the Senate, the House of Representatives, or any government agency. It links to official records so readers can verify details at the source.",
    },
    {
      _key: "faq-data",
      question: "Where does the data come from?",
      answer:
        "Lawmaker profiles and authorship history come from BetterGov's Open Congress API. Live status, committee referrals, plain-language summaries, and 20th Congress bills filed since late 2025 come from BatasWatch, an independent bill tracker. The plain-language summaries are automated and labelled as such.",
    },
    {
      _key: "faq-different",
      question: "How is it different from the Senate and House websites?",
      answer:
        "The chamber websites are the authoritative record. CivicSync is a guide to them: it searches both chambers at once, groups a lawmaker's whole career in one profile, combines history with live status on one page per bill, and lets people follow bills from their phone.",
    },
    {
      _key: "faq-privacy",
      question: "Does it collect personal data?",
      answer:
        "No account is needed. The Watchlist is stored on the user's own device. Users who choose to sign in with Google have their Watchlist synced to their account so it follows them across devices.",
    },
    {
      _key: "faq-cost",
      question: "What does it cost?",
      answer: "CivicSync is free to use, and its source code is public on GitHub.",
    },
  ],
};
