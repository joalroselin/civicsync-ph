import type { Metadata } from "next";
import Link from "next/link";
import { getSiteSettings } from "@/lib/content";
import { mailtoHref } from "@/lib/content-defaults";
import { PageHeader } from "../components/PageHeader";

export const metadata: Metadata = {
  title: "Privacy",
  description: "What CivicSync PH stores on your device, what it stores when you sign in, and what it never collects.",
};

/** Bump when the facts below change. Kept in code (not the CMS) so every change is in git history. */
const UPDATED = "3 October 2026";

export default async function PrivacyPage() {
  const { contactEmail } = await getSiteSettings();
  const deleteHref = mailtoHref(contactEmail, "Privacy request: CivicSync PH");

  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="Privacy" />
      <div className="max-w-3xl">
        <section className="rounded-[20px] bg-navy p-6 text-white shadow-md md:p-8">
          <h2 className="font-display text-2xl font-semibold leading-tight md:text-3xl">Privacy first, in plain language.</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-indigo-100 md:text-lg">
            No account needed, no ads, no selling data, no tracking you across other sites. Here’s exactly what CivicSync stores, and where.
          </p>
        </section>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <Promise title="Without signing in" body="Everything stays on your device. We don’t know who you are." />
          <Promise title="If you sign in" body="Only your Watchlist is synced, so it follows you to other devices." />
          <Promise title="Never" body="No ads, no data sales, no cross-site tracking, no cookies for analytics." />
        </div>

        <Section title="On your device">
          <p>These stay in your browser. Clearing your browser data removes them.</p>
          <Table
            rows={[
              ["Your Watchlist", "The bills you follow: number, title and last-seen status."],
              ["Sign-in flag", "Remembers that you signed in, so syncing only loads when you use it."],
              ["Dismissed tips", "Remembers if you closed “Start here” or the “install app” suggestion."],
              ["Theme", "Remembers if you picked Light or Dark instead of following your device."],
              ["Home feed choice", "Remembers whether you last viewed newly filed or moving bills, and which chamber."],
              ["Offline copies", "Recently viewed pages, so the app still opens without signal."],
            ]}
          />
        </Section>

        <Section title="If you sign in with Google">
          <p>
            Signing in is optional and only used to sync your Watchlist across devices. Google shares your name, email address and profile photo with
            our sign-in provider (Firebase, by Google). Your Watchlist is stored in your own private space that only you can read or change.
          </p>
          <p>We don’t email you, share your address, or use it for anything else.</p>
        </Section>

        <Section title="If you send us a form">
          <p>
            Forms like the translator list or partnership enquiries store only what you type in. We use it to reply to you, keep it in a private inbox,
            and delete it when you ask. To block spam, your network address is held briefly in memory and never saved.
          </p>
        </Section>

        <Section title="Visit counts">
          <p>
            We count page views and page speed with Vercel Analytics, without cookies and without identifying you. It tells us which pages are useful
            and which links bring people here (for example, “from Instagram”). It can’t follow you to other sites.
          </p>
        </Section>

        <Section title="Embeds and badges">
          <p>Bill cards and badges shown on other websites set no cookies and run no scripts.</p>
        </Section>

        <Section title="Where the bill data comes from">
          <p>
            Bill and lawmaker information is public record, from{" "}
            <Link href="/about" className="font-semibold text-navy-ink underline underline-offset-2">
              our data sources
            </Link>
            . When we look up a bill for you, those sources see a request from CivicSync, not from you.
          </p>
        </Section>

        <Section title="Your choices">
          <ul className="list-disc space-y-2 pl-5">
            <li>Use CivicSync without signing in. Everything works.</li>
            <li>Sign out any time from the Watchlist page. Your on-device list stays.</li>
            <li>
              Ask us to delete your synced Watchlist, your sign-in record or a form you sent, or to send you a copy:{" "}
              <a href={deleteHref} className="font-semibold text-crimson-ink underline underline-offset-2">
                {contactEmail}
              </a>
              .
            </li>
          </ul>
          <p>We follow the Philippine Data Privacy Act of 2012 (Republic Act No. 10173).</p>
        </Section>

        <p className="mt-10 text-xs text-gray-400">Last updated {UPDATED}. The code is open source, so you can check all of this yourself.</p>
      </div>
    </main>
  );
}

function Promise({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl bg-surface p-4 ring-1 ring-gray-200/70">
      <h3 className="text-sm font-semibold text-navy-ink">{title}</h3>
      <p className="mt-1 text-sm leading-relaxed text-gray-600">{body}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl font-semibold text-gray-900">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-gray-700 md:text-base">{children}</div>
    </section>
  );
}

function Table({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="divide-y divide-gray-100 rounded-2xl bg-surface ring-1 ring-gray-200/70">
      {rows.map(([k, v]) => (
        <div key={k} className="grid gap-1 p-4 sm:grid-cols-[160px_1fr] sm:gap-4">
          <dt className="text-sm font-semibold text-gray-900">{k}</dt>
          <dd className="text-sm text-gray-600">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
