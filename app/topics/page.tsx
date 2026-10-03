import type { Metadata } from "next";
import { listPolicyAreas } from "@/lib/batasWatch";
import { PageHeader } from "../components/PageHeader";
import { TopicGrid } from "../components/TopicGrid";
import { LiveDataUnavailable } from "../components/LiveDataUnavailable";

export const metadata: Metadata = {
  title: "Browse bills by topic",
  description: "Bills filed in the 20th Congress of the Philippines, grouped by topic: health, education, agriculture, labor and more.",
};

export default async function TopicsPage() {
  const topics = await listPolicyAreas().catch(() => null);
  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="Topics" back="/receipts" />
      <p className="-mt-2 mb-5 max-w-2xl text-sm text-gray-600">
        Bills filed in the 20th Congress, grouped by what they’re about. Counts are bills where it’s the main topic.
      </p>
      <div className="max-w-4xl">{topics ? <TopicGrid topics={topics} /> : <LiveDataUnavailable what="The topic list" />}</div>
      <p className="mt-6 max-w-2xl text-[11px] text-gray-500">Topics are assigned automatically by BatasWatch from each bill’s text, so a few may be off.</p>
    </main>
  );
}
