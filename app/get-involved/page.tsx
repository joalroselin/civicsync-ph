import type { Metadata } from "next";
import Link from "next/link";
import { getGetInvolvedPage, getSiteSettings, type Way, type WayIcon } from "@/lib/content";
import { PageHeader } from "../components/PageHeader";
import { ShareSiteButton } from "./ShareSiteButton";
import { EmailAction } from "../components/EmailAction";
import { IntakeForm } from "../components/IntakeForm";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getGetInvolvedPage();
  return { title: "Get involved", description: page.intro };
}

const REPO_URL = "https://github.com/joalroselin/civicsync-ph";

/** Edited in Sanity Studio (Get involved page, and Site settings for email/social links). */
export default async function GetInvolvedPage() {
  const [page, settings] = await Promise.all([getGetInvolvedPage(), getSiteSettings()]);

  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="Get involved" />

      <section className="max-w-3xl">
        <p className="font-display text-sm font-semibold uppercase tracking-wider text-crimson-ink">{page.kicker}</p>
        <h2 className="mt-2 font-display text-3xl font-semibold leading-tight text-gray-900 md:text-4xl">{page.title}</h2>
        <p className="mt-3 text-[15px] leading-relaxed text-gray-700 md:text-lg">{page.intro}</p>
      </section>

      <ul className="mt-8 grid max-w-5xl gap-4 md:grid-cols-2 xl:grid-cols-3">
        {page.ways.map((way) => (
          <WayCard key={way._key} way={way} email={settings.contactEmail} />
        ))}
      </ul>

      {settings.socialLinks.length > 0 && (
        <section className="mt-10 max-w-5xl" aria-labelledby="follow-heading">
          <h2 id="follow-heading" className="font-display text-xl font-semibold">
            Follow CivicSync
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {settings.socialLinks.map((s) => (
              <li key={s._key}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex rounded-full bg-surface px-4 py-2 text-sm font-semibold text-navy-ink ring-1 ring-gray-200 hover:ring-navy-ink/40"
                >
                  {s.platform}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-10 max-w-5xl rounded-2xl bg-navy p-5 text-white md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-lg font-semibold">Open source, built in the open</p>
            <p className="mt-1 max-w-2xl text-sm leading-relaxed text-indigo-100">
              CivicSync’s code is licensed under the GNU AGPL-3.0, so improvements to it stay public, with commercial
              licences for businesses that need other terms. Everyone taking part agrees to our code of conduct and
              keeps CivicSync non-partisan.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2 text-sm font-semibold">
            <a href={`${REPO_URL}/blob/main/CONTRIBUTING.md`} target="_blank" rel="noreferrer" className="rounded-xl bg-surface px-4 py-2.5 text-navy-ink">
              Contributing guide
            </a>
            <a href={`${REPO_URL}/blob/main/CODE_OF_CONDUCT.md`} target="_blank" rel="noreferrer" className="rounded-xl px-4 py-2.5 ring-1 ring-white/40 hover:bg-white/10">
              Code of conduct
            </a>
          </div>
        </div>
      </section>

      <p className="mt-6 text-sm text-gray-600">
        Want to know more first? Read{" "}
        <Link href="/about" className="font-semibold text-navy-ink underline underline-offset-2">
          about CivicSync
        </Link>
        .
      </p>
    </main>
  );
}

function WayCard({ way, email }: { way: Way; email: string }) {
  const button =
    "inline-flex items-center justify-center rounded-xl bg-crimson px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-900";
  return (
    <li className={`relative flex flex-col rounded-2xl p-5 shadow-sm ring-1 ${way.comingSoon ? "bg-gray-50 ring-gray-200" : "bg-surface ring-gray-200/70"}`}>
      {way.comingSoon && (
        <span className="absolute -right-2 -top-3 rotate-6 rounded-md bg-amber-300 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-950 shadow-md ring-1 ring-amber-400/60">
          Coming soon
        </span>
      )}
      <div className="flex items-start justify-between gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-crimson-ink/10 text-crimson-ink">
          <Icon name={way.icon ?? "lightbulb"} />
        </span>
        {way.effort && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{way.effort}</span>
        )}
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-gray-900">{way.title}</h3>
      <p className="mt-1.5 flex-1 text-sm leading-relaxed text-gray-700">{way.description}</p>
      <div className="mt-5">
        {way.action === "form" && way.formKind ? (
          <IntakeForm kind={way.formKind} label={way.buttonLabel} buttonClassName={button} email={email} />
        ) : way.action === "share" ? (
          <ShareSiteButton label={way.buttonLabel} className={button} />
        ) : way.action === "link" && way.url ? (
          <a href={way.url} target={way.url.startsWith("/") ? undefined : "_blank"} rel="noreferrer" className={button}>
            {way.buttonLabel}
          </a>
        ) : (
          <EmailAction
            email={email}
            subject={way.emailSubject || "Get involved: CivicSync PH"}
            body={way.emailBody}
            label={way.buttonLabel}
            buttonClassName={button}
          />
        )}
      </div>
    </li>
  );
}

function Icon({ name }: { name: WayIcon }) {
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  switch (name) {
    case "megaphone":
      return <svg {...common}><path d="M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13" /></svg>;
    case "flag":
      return <svg {...common}><path d="M5 21V4M5 4h11l-2 4 2 4H5" /></svg>;
    case "language":
      return <svg {...common}><path d="M4 5h9M8.5 3v2M6 5c.8 3.2 2.8 5.6 5.5 7M11 5c-.8 3.8-3.3 6.8-6.5 8.5" /><path d="m13 21 4-9 4 9M14.5 18h5" /></svg>;
    case "code":
      return <svg {...common}><path d="m8 7-5 5 5 5M16 7l5 5-5 5M13.5 4l-3 16" /></svg>;
    case "handshake":
      return <svg {...common}><path d="m11 17 2 2a1.5 1.5 0 0 0 2-2l-1-1M13 15l2.5 2.5a1.5 1.5 0 0 0 2-2L14 12M3 9l4-4 5 2 3-1 6 5-3 3-2-2" /><path d="m7 5-4 7 5 5 2-2" /></svg>;
    case "briefcase":
      return <svg {...common}><rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 13h18" /></svg>;
    default:
      return <svg {...common}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" /></svg>;
  }
}
