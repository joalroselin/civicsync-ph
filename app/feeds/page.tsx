import type { Metadata } from "next";
import Link from "next/link";
import { listPolicyAreas } from "@/lib/batasWatch";
import { SITE_URL } from "@/lib/site";
import { PageHeader } from "../components/PageHeader";
import { CopyButton } from "../press/CopyButton";

export const metadata: Metadata = {
  title: "News feeds (RSS)",
  description: "Follow new and moving Philippine bills, by topic or by lawmaker, in any news reader, Slack, email or Zapier.",
};

export default async function FeedsPage() {
  const topics = await listPolicyAreas().catch(() => []);
  const main = [
    { title: "Newly filed bills", path: "/feeds/latest", note: "Every new Senate and House bill." },
    { title: "Bills on the move", path: "/feeds/moving", note: "Bills that passed a reading or moved chambers. House for now." },
  ];
  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="News feeds" />
      <div className="max-w-3xl">
        <p className="text-[15px] leading-relaxed text-gray-700">
          Get CivicSync updates where you already read: a news reader like Feedly or Inoreader, a Slack or Discord channel, or email through Zapier or
          IFTTT. Copy a feed link and paste it into the app’s “add feed” or “RSS” option. No sign-up with us needed.
        </p>

        <ul className="mt-6 flex flex-col gap-2">
          {main.map((f) => (
            <FeedRow key={f.path} {...f} />
          ))}
        </ul>

        <h2 className="mt-10 text-xs font-semibold uppercase tracking-wider text-gray-500">By lawmaker</h2>
        <p className="mt-2 text-sm text-gray-700">
          Open any lawmaker’s page from{" "}
          <Link href="/receipts" className="font-semibold text-navy-ink underline underline-offset-2">
            Receipts
          </Link>{" "}
          and use the RSS link under their record. You’ll see their new bills and status changes.
        </p>

        {topics.length > 0 && (
          <>
            <h2 className="mt-10 text-xs font-semibold uppercase tracking-wider text-gray-500">By topic</h2>
            <ul className="mt-3 flex flex-col gap-2">
              {topics.map((t) => (
                <FeedRow key={t.id} title={t.label} path={`/feeds/topics/${t.id}`} />
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}

function FeedRow({ title, path, note }: { title: string; path: string; note?: string }) {
  const url = `${SITE_URL}${path}`;
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3 ring-1 ring-gray-200/70">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-gray-900">{title}</p>
        {note && <p className="text-xs text-gray-500">{note}</p>}
        <p className="truncate font-mono text-[11px] text-gray-500">{url}</p>
      </div>
      <CopyButton text={url} />
    </li>
  );
}
