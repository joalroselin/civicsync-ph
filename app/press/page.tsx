import type { Metadata } from "next";
import Image from "next/image";
import { PageHeader } from "../components/PageHeader";
import { CopyButton } from "./CopyButton";

export const metadata: Metadata = {
  title: "Press kit",
  description: "Logos, screenshots, fact sheet, and boilerplate for writing about CivicSync PH.",
};

const SITE_URL = "https://civicsync-ph-gamma.vercel.app";
const REPO_URL = "https://github.com/joalroselin/civicsync-ph";
/** Add a press email here to show it on the page; until then contact goes via GitHub. */
const CONTACT_EMAIL = "";

const BOILERPLATE = {
  oneLine: "CivicSync PH is a free app for looking up Philippine lawmakers and the bills they file.",
  short:
    "CivicSync PH is a free, mobile-first web app that makes Philippine legislative records easier to use. Search the Senate and House of Representatives in one place, see every bill a lawmaker has authored across 13 congresses since 1987, check where a bill stands today, and follow the bills you care about. No sign-up required.",
  long:
    "CivicSync PH is a free, mobile-first web app that helps Filipinos find and follow the work of their lawmakers. The Philippine Congress has two chambers, each with its own website, formats, and numbering, and each three-year Congress sees thousands of bills filed. CivicSync brings those records together: one search across the Senate and House, one profile per lawmaker covering their whole career across both chambers, and one page per bill combining its history with its current status, committee, a plain-language summary, and links to the official record. Users can bookmark bills to a Watchlist without creating an account. CivicSync is built on open data from BetterGov's Open Congress API and BatasWatch, and is designed as a guide to the official record, not a replacement for it. It was built by independent developer HelloJoal, with AI assistance, and its source code is public.",
};

const FACTS: [string, React.ReactNode][] = [
  ["Launched", "September 2026"],
  ["Built by", <>HelloJoal, independent developer (assisted by AI)</>],
  ["Price", "Free, no account required"],
  ["Platform", "Web app, installable on phones and desktops (PWA)"],
  ["Coverage", "13 congresses: 8th to 20th (1987 to present)"],
  ["Records", "165,000+ legislative records; 13,600+ bills in the current 20th Congress"],
  ["Live status", "20th Congress bills (status, committee, summaries)"],
  ["Data sources", "BetterGov Open Congress API; BatasWatch"],
  ["Website", <a key="w" href={SITE_URL} className="text-navy underline">{SITE_URL.replace("https://", "")}</a>],
  ["Source code", <a key="r" href={REPO_URL} className="text-navy underline">github.com/joalroselin/civicsync-ph</a>],
];

const FEATURES = [
  ["Receipts", "Search any senator or representative and see every bill they've authored, across both chambers and 13 congresses."],
  ["One search", "Find bills by keyword or by number, typed however you like: “SB 1294”, “hb4659”, or a topic."],
  ["Bill pages", "Where a bill is now, which committee it's in, a plain-language summary, and links to the official record."],
  ["Watchlist", "Bookmark bills to follow; statuses refresh each visit. Optional sign-in syncs across devices."],
  ["Works anywhere", "Built for phones first, scales to desktop, installs like an app, and opens visited pages offline."],
];

const LOGOS = [
  { file: "civicsync-horizontal-on-light.png", label: "Horizontal · for light backgrounds", dark: false },
  { file: "civicsync-horizontal-on-dark.png", label: "Horizontal · for dark backgrounds", dark: true },
  { file: "civicsync-stacked-on-light.png", label: "Stacked · for light backgrounds", dark: false },
  { file: "civicsync-stacked-on-dark.png", label: "Stacked · for dark backgrounds", dark: true },
  { file: "civicsync-icon.png", label: "App icon · 2048px PNG", dark: false, svg: "civicsync-icon.svg" },
];

const SCREENSHOTS = [
  { file: "phone-1-home.png", label: "Home", phone: true },
  { file: "phone-2-lawmaker.png", label: "Lawmaker profile", phone: true },
  { file: "phone-3-bill.png", label: "Bill page", phone: true },
  { file: "phone-4-watchlist.png", label: "Watchlist", phone: true },
  { file: "phone-5-search.png", label: "Search results", phone: true },
  { file: "desktop-1-home.png", label: "Desktop · Home", phone: false },
  { file: "desktop-2-lawmaker.png", label: "Desktop · Lawmaker profile", phone: false },
];

const COLORS = [
  { name: "Navy", hex: "#1E3A8A", use: "Primary: brand, headers, links", text: "text-white" },
  { name: "Crimson", hex: "#991B1B", use: "Accent: logo dot, Watchlist", text: "text-white" },
  { name: "Paper", hex: "#F9FAFB", use: "Background", text: "text-gray-900" },
];

const FAQ = [
  [
    "Is CivicSync an official government website?",
    "No. CivicSync is independent and non-partisan, and is not affiliated with the Senate, the House of Representatives, or any government agency. It links to official records so readers can verify details at the source.",
  ],
  [
    "Where does the data come from?",
    "Lawmaker profiles and authorship history come from BetterGov's Open Congress API. Live status, committee referrals, plain-language summaries, and 20th Congress bills filed since late 2025 come from BatasWatch, an independent bill tracker. The plain-language summaries are automated and labelled as such.",
  ],
  [
    "How is it different from the Senate and House websites?",
    "The chamber websites are the authoritative record. CivicSync is a guide to them: it searches both chambers at once, groups a lawmaker's whole career in one profile, combines history with live status on one page per bill, and lets people follow bills from their phone.",
  ],
  [
    "Does it collect personal data?",
    "No account is needed. The Watchlist is stored on the user's own device. Users who choose to sign in with Google have their Watchlist synced to their account so it follows them across devices.",
  ],
  [
    "What does it cost?",
    "CivicSync is free to use, and its source code is public on GitHub.",
  ],
];

export default function PressPage() {
  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="Press kit" />

      <section className="max-w-3xl">
        <p className="text-[15px] leading-relaxed text-gray-700 md:text-base">
          Everything you need to write about CivicSync PH: descriptions, key facts, logos, and screenshots. All
          materials may be used freely for editorial coverage.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/press/civicsync-press-kit.zip"
            download
            className="inline-flex items-center gap-2 rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-white hover:bg-blue-900"
          >
            <DownloadIcon /> Download full kit (.zip)
          </a>
          <a
            href="/press/civicsync-fact-sheet.pdf"
            download
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-navy ring-1 ring-gray-200 hover:ring-navy/40"
          >
            <DownloadIcon /> Fact sheet (PDF)
          </a>
        </div>
      </section>

      <Section title="About CivicSync PH">
        <div className="grid gap-4 lg:grid-cols-3">
          <Boilerplate label="One line" text={BOILERPLATE.oneLine} />
          <Boilerplate label="Short · ~50 words" text={BOILERPLATE.short} className="lg:col-span-2" />
          <Boilerplate label="Long · ~140 words" text={BOILERPLATE.long} className="lg:col-span-3" />
        </div>
      </Section>

      <Section title="Fact sheet">
        <dl className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200/70">
          {FACTS.map(([k, v]) => (
            <div key={k} className="grid gap-1 border-b border-gray-100 px-4 py-3 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-4">
              <dt className="text-xs font-semibold uppercase tracking-wider text-gray-500 sm:pt-0.5">{k}</dt>
              <dd className="text-sm text-gray-900">{v}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-xs text-gray-400">Record counts as of 24 September 2026.</p>
      </Section>

      <Section title="Key features">
        <ul className="grid gap-3 md:grid-cols-2">
          {FEATURES.map(([name, desc]) => (
            <li key={name} className="rounded-2xl bg-white p-4 ring-1 ring-gray-200/70">
              <p className="font-display font-semibold text-navy">{name}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-700">{desc}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Logos">
        <ul className="grid gap-4 sm:grid-cols-2">
          {LOGOS.map((l) => (
            <li key={l.file} className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200/70">
              <div className={`grid h-40 place-items-center p-6 ${l.dark ? "bg-navy" : "bg-paper"}`}>
                <Image
                  src={`/press/logos/${l.file}`}
                  alt={l.label}
                  width={400}
                  height={200}
                  className="max-h-24 w-auto object-contain"
                />
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="text-gray-700">{l.label}</span>
                <span className="flex shrink-0 gap-3 font-semibold">
                  <a href={`/press/logos/${l.file}`} download className="text-navy hover:underline">
                    PNG
                  </a>
                  {l.svg && (
                    <a href={`/press/logos/${l.svg}`} download className="text-navy hover:underline">
                      SVG
                    </a>
                  )}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-200/70">
            <p className="font-semibold text-gray-900">Please do</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
              <li>Leave clear space around the logo, at least the height of the icon’s dot</li>
              <li>Use the “on dark” version on dark or photo backgrounds</li>
              <li>Write the name as “CivicSync PH”, or “CivicSync” for short</li>
            </ul>
          </div>
          <div className="rounded-2xl bg-white p-4 ring-1 ring-gray-200/70">
            <p className="font-semibold text-gray-900">Please don’t</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700">
              <li>Recolour, stretch, rotate, or add effects to the logo</li>
              <li>Suggest CivicSync is an official government service</li>
              <li>Write it as “Civic Sync” or “CIVICSYNC”</li>
            </ul>
          </div>
        </div>
      </Section>

      <Section title="Screenshots">
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {SCREENSHOTS.filter((s) => s.phone).map((s) => (
            <Screenshot key={s.file} {...s} />
          ))}
        </ul>
        <ul className="mt-4 grid gap-4 md:grid-cols-2">
          {SCREENSHOTS.filter((s) => !s.phone).map((s) => (
            <Screenshot key={s.file} {...s} />
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-400">
          Phone: 1170×2532 · Desktop: 2880×1800. Screens show real 20th Congress bills as of September 2026.
        </p>
      </Section>

      <Section title="Brand">
        <ul className="grid gap-3 sm:grid-cols-3">
          {COLORS.map((c) => (
            <li key={c.hex} className="overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200/70">
              <div className={`flex h-20 items-end p-3 font-mono text-sm ${c.text}`} style={{ background: c.hex }}>
                {c.hex}
              </div>
              <div className="px-3 py-2.5 text-sm">
                <p className="font-semibold">{c.name}</p>
                <p className="text-gray-600">{c.use}</p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-gray-700">
          Typefaces: <span className="font-display font-semibold">Space Grotesk</span> for headings and{" "}
          <span className="font-semibold">Inter</span> for body text. Both are free on Google Fonts.
        </p>
      </Section>

      <Section title="Crediting the data">
        <div className="rounded-2xl bg-white p-4 text-sm leading-relaxed text-gray-700 ring-1 ring-gray-200/70">
          <p>
            CivicSync is built on open civic data. When describing where its information comes from, please credit:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <a href="https://open-congress-api.bettergov.ph" className="text-navy underline">
                BetterGov Open Congress API
              </a>{" "}
              for lawmaker profiles and authorship history
            </li>
            <li>
              <a href="https://bills.juris.ph" className="text-navy underline">
                BatasWatch
              </a>{" "}
              for live bill status, committees, and plain-language summaries
            </li>
          </ul>
          <p className="mt-3">
            Suggested line:{" "}
            <em>
              “CivicSync PH draws on open data from BetterGov’s Open Congress API and BatasWatch, and links to the
              official Senate and House records.”
            </em>
          </p>
        </div>
      </Section>

      <Section title="FAQ">
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl bg-white ring-1 ring-gray-200/70">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group px-4 py-3">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-gray-900">
                {q}
                <span className="text-gray-400 transition group-open:rotate-45" aria-hidden>
                  +
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">{a}</p>
            </details>
          ))}
        </div>
      </Section>

      <Section title="Contact">
        <div className="rounded-2xl bg-white p-4 text-sm leading-relaxed text-gray-700 ring-1 ring-gray-200/70">
          <p>
            <span className="font-semibold text-gray-900">HelloJoal</span> is the independent developer behind
            CivicSync PH.
          </p>
          <p className="mt-2">
            {CONTACT_EMAIL ? (
              <>
                Press enquiries:{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-navy underline">
                  {CONTACT_EMAIL}
                </a>
              </>
            ) : (
              <>
                For press enquiries, open an issue on{" "}
                <a href={`${REPO_URL}/issues`} className="font-semibold text-navy underline">
                  GitHub
                </a>
                .
              </>
            )}
          </p>
        </div>
      </Section>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const id = title.toLowerCase().replace(/[^a-z]+/g, "-");
  return (
    <section aria-labelledby={id} className="mt-10 max-w-5xl">
      <h2 id={id} className="mb-3 font-display text-xl font-semibold">
        {title}
      </h2>
      {children}
    </section>
  );
}

function Boilerplate({ label, text, className = "" }: { label: string; text: string; className?: string }) {
  return (
    <div className={`flex flex-col rounded-2xl bg-white p-4 ring-1 ring-gray-200/70 ${className}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</span>
        <CopyButton text={text} />
      </div>
      <p className="text-sm leading-relaxed text-gray-800">{text}</p>
    </div>
  );
}

function Screenshot({ file, label, phone }: { file: string; label: string; phone: boolean }) {
  return (
    <li>
      <a href={`/press/screenshots/${file}`} download className="group block">
        <Image
          src={`/press/screenshots/${file}`}
          alt={`CivicSync PH: ${label}`}
          width={phone ? 390 : 1440}
          height={phone ? 844 : 900}
          className={`w-full rounded-2xl bg-white ring-1 ring-gray-200 transition group-hover:ring-navy/40 ${
            phone ? "" : "aspect-[16/10] object-cover object-top"
          }`}
          sizes={phone ? "(min-width: 1024px) 180px, 45vw" : "(min-width: 768px) 45vw, 90vw"}
        />
        <span className="mt-1.5 flex items-center justify-between text-xs text-gray-600">
          {label}
          <span className="font-semibold text-navy opacity-0 transition group-hover:opacity-100">Download</span>
        </span>
      </a>
    </li>
  );
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
