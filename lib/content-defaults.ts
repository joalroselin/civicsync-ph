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

export interface SocialLink {
  _key: string;
  platform: string;
  url: string;
}
export interface SiteSettings {
  contactEmail: string;
  socialLinks: SocialLink[];
  homeSuggestions: string[];
  stats: { currentCongressBills: string; totalRecords: string; asOf: string };
  announcement: { enabled: boolean; message: string; linkLabel?: string; linkUrl?: string };
}
export interface AboutPage {
  title: string;
  intro: string;
  body: PortableBlock[];
}
export type WayIcon = "megaphone" | "flag" | "lightbulb" | "language" | "code" | "handshake" | "briefcase";
export interface Way {
  _key: string;
  title: string;
  description: string;
  effort?: string;
  icon?: WayIcon;
  action: "email" | "link" | "share";
  buttonLabel: string;
  emailSubject?: string;
  url?: string;
  comingSoon?: boolean;
}
export interface GetInvolvedPage {
  kicker: string;
  title: string;
  intro: string;
  ways: Way[];
}
export interface PressKit {
  oneLine: string;
  short: string;
  long: string;
  faq: { _key: string; question: string; answer: string }[];
}

const REPO_URL = "https://github.com/joalroselin/civicsync-ph";
const CONTACT_EMAIL = "hello.joaldev@gmail.com";

/** Pre-filled subjects so enquiries are easy to sort in the inbox. */
export const ENQUIRY_SUBJECTS = {
  general: "Enquiry: CivicSync PH",
  press: "Press enquiry: CivicSync PH",
  dataCorrection: "Data correction: CivicSync PH",
  commercial: "Commercial licence: CivicSync PH",
} as const;

export function mailtoHref(email: string, subject: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}`;
}

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
  contactEmail: CONTACT_EMAIL,
  socialLinks: [
    { _key: "social-facebook", platform: "Facebook", url: "https://www.facebook.com/civicsyncphilippines" },
    { _key: "social-instagram", platform: "Instagram", url: "https://www.instagram.com/civicsyncph" },
  ],
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
    h2("Open source"),
    p(
      "CivicSync is open source under the ",
      { text: "GNU Affero General Public License v3.0", href: `${REPO_URL}/blob/main/LICENSE` },
      " (AGPL-3.0). Anyone can read, reuse, and improve the code. If someone runs a modified version for the public, they must share their changes too, so improvements to civic tools stay public. The licence covers our code; legislative data belongs to its sources."
    ),
    p(
      "Organisations that can’t meet the AGPL’s terms, for example to build CivicSync into a closed-source product, can ",
      { text: "ask about a commercial licence", href: mailtoHref(CONTACT_EMAIL, ENQUIRY_SUBJECTS.commercial) },
      ". Licence fees help fund CivicSync’s development."
    ),
    h2("Help shape it"),
    p(
      "CivicSync is free and still growing. Questions, ideas, or spotted a problem? Email ",
      { text: CONTACT_EMAIL, href: mailtoHref(CONTACT_EMAIL, ENQUIRY_SUBJECTS.general) },
      ". Want to do more? See ",
      { text: "ways to get involved", href: "/get-involved" },
      ". Journalists can find logos, screenshots, and a fact sheet in the ",
      { text: "press kit", href: "/press" },
      "."
    ),
  ],
};

export const DEFAULT_GET_INVOLVED_PAGE: GetInvolvedPage = {
  kicker: "Bayanihan",
  title: "Help make Philippine laws easier to follow",
  intro:
    "CivicSync is free, independent, and built in the open. Whether you have five minutes or a few hours a month, there’s a way to help more Filipinos find and follow the work of their lawmakers.",
  ways: [
    {
      _key: "way-share",
      title: "Spread the word",
      description: "Share CivicSync with friends, family, or your community. The more people check the receipts, the better.",
      effort: "2 minutes",
      icon: "megaphone",
      action: "share",
      buttonLabel: "Share CivicSync",
    },
    {
      _key: "way-report",
      title: "Report a data error",
      description:
        "Spotted a wrong status, author, or title? Every bill page has a “Report an issue” link, or email us with the bill number and what looks wrong.",
      effort: "5 minutes",
      icon: "flag",
      action: "email",
      buttonLabel: "Report an error",
      emailSubject: "Data correction: CivicSync PH",
    },
    {
      _key: "way-ideas",
      title: "Suggest a feature",
      description: "Tell us what would make CivicSync more useful to you. A public roadmap where you can vote on ideas is coming soon.",
      effort: "5 minutes",
      icon: "lightbulb",
      action: "email",
      buttonLabel: "Share an idea",
      emailSubject: "Feature idea: CivicSync PH",
    },
    {
      _key: "way-translate",
      title: "Help translate",
      description:
        "We’re planning Filipino and major regional languages, reviewed by native speakers. Join the translator list and we’ll reach out when it’s ready.",
      effort: "A few hours",
      icon: "language",
      action: "email",
      buttonLabel: "Join the translator list",
      emailSubject: "Contribute: Translation",
    },
    {
      _key: "way-code",
      title: "Contribute code or design",
      description:
        "CivicSync is open source (AGPL-3.0). Developers and designers can pick up an issue, improve the app, or propose something new. Start with the contributing guide.",
      effort: "Ongoing",
      icon: "code",
      action: "link",
      buttonLabel: "View on GitHub",
      url: `${REPO_URL}/blob/main/CONTRIBUTING.md`,
    },
    {
      _key: "way-partner",
      title: "Partner with us",
      description: "Civic groups, universities, newsrooms, and data providers: let’s work together to make legislative information more accessible.",
      effort: "For organisations",
      icon: "handshake",
      action: "email",
      buttonLabel: "Get in touch",
      emailSubject: "Partnership: CivicSync PH",
    },
    {
      _key: "way-commercial",
      title: "Commercial licensing",
      description:
        "Want to build CivicSync into a closed-source product, or run a modified version without publishing your changes? A commercial licence lets you, and helps fund development.",
      effort: "For businesses",
      icon: "briefcase",
      action: "email",
      buttonLabel: "Ask about a licence",
      emailSubject: "Commercial licence: CivicSync PH",
    },
  ],
};

export const DEFAULT_PRESS_KIT: PressKit = {
  oneLine: "CivicSync PH is a free app for looking up Philippine lawmakers and the bills they file.",
  short:
    "CivicSync PH is a free, mobile-first web app that makes Philippine legislative records easier to use. Search the Senate and House of Representatives in one place, see every bill a lawmaker has authored across 13 congresses since 1987, check where a bill stands today, and follow the bills you care about. No sign-up required.",
  long:
    "CivicSync PH is a free, mobile-first web app that helps Filipinos find and follow the work of their lawmakers. The Philippine Congress has two chambers, each with its own website, formats, and numbering, and each three-year Congress sees thousands of bills filed. CivicSync brings those records together: one search across the Senate and House, one profile per lawmaker covering their whole career across both chambers, and one page per bill combining its history with its current status, committee, a plain-language summary, and links to the official record. Users can bookmark bills to a Watchlist without creating an account. CivicSync is built on open data from BetterGov's Open Congress API and BatasWatch, and is designed as a guide to the official record, not a replacement for it. It was built by independent developer HelloJoal, with AI assistance, and is open source under the AGPL-3.0 licence.",
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
      _key: "faq-commercial",
      question: "Can businesses use CivicSync's code?",
      answer:
        "Yes. The code is open source under the AGPL-3.0, which allows commercial use as long as modified versions that others use are shared under the same licence. Organisations that want to keep their changes private or build a closed-source product can buy a commercial licence instead.",
    },
    {
      _key: "faq-cost",
      question: "What does it cost?",
      answer: "CivicSync is free to use, and it is open source under the GNU AGPL-3.0 licence. The code is on GitHub.",
    },
  ],
};
