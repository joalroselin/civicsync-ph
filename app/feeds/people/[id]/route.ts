import { getPerson, personName } from "@/lib/openCongress";
import { withProfiles } from "@/lib/authorIndex";
import { liveBills } from "@/lib/people";
import { toTitleCase } from "@/lib/format";
import { rssResponse } from "@/lib/rss";

/** A lawmaker's 20th Congress bills, newest first. */
export async function GET(_req: Request, props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const person = await getPerson(id)
    .then((p) => withProfiles([p]).then(([x]) => x))
    .catch(() => null);
  if (!person) return new Response("Lawmaker not found", { status: 404 });
  const pages = await Promise.all([1, 2].map((p) => liveBills(person, p)));
  const bills = pages.flatMap((p) => p?.data ?? []);
  const name = personName(person);
  return rssResponse({
    title: `CivicSync PH: Bills by ${name}`,
    description: `Bills authored by ${name} in the 20th Congress of the Philippines, with their latest status.`,
    path: `/feeds/people/${id}`,
    campaign: "feed-lawmaker",
    // Status in the guid so a status change shows up as a new item.
    items: bills.map((b) => ({ bill: { ...b, title: toTitleCase(b.title) }, date: b.dateFiled, guid: `${b.routeId}@${b.status ?? ""}` })),
  });
}
