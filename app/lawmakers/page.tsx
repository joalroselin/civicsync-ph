import type { Metadata } from "next";
import Link from "next/link";
import { lawmakerData, memberKey } from "@/lib/lawmakers";
import { formatDate, seatLabel, toTitleCase } from "@/lib/format";
import { PageHeader } from "../components/PageHeader";
import { LawmakersTable, type Row } from "./LawmakersTable";

export const metadata: Metadata = {
  title: "All lawmakers",
  description: "Every senator and representative in the 20th Congress of the Philippines: bills filed, bills that became law, and their record across congresses.",
};

export default function LawmakersPage() {
  const rows: Row[] = lawmakerData.members.map((m) => ({
    key: memberKey(m),
    id: m.id,
    name: m.name,
    lastName: m.lastName,
    chamber: m.chamber,
    sub: m.chamber === "senate" ? (m.position !== "Senator" ? m.position : "Senate") : (seatLabel(m.representation) ?? "House"),
    portraitUrl: m.portraitUrl,
    profileUrl: m.officialProfileUrl ?? null,
    filed: m.filedThisCongress,
    laws: m.becameLaw,
    lawList: m.laws.map((l) => ({ number: l.number, ra: l.ra, title: toTitleCase(l.title) })),
    total: m.totalOnRecord,
    served: m.congressesServed,
    byCongress: Object.fromEntries(m.congresses.map((c) => [c.congress, c.bills])),
  }));

  return (
    <main className="px-5 pb-28 md:pt-4">
      <PageHeader title="Lawmakers" back="/receipts" />
      <p className="-mt-2 mb-4 max-w-3xl text-sm text-gray-600">
        All {rows.length} current senators and representatives. Sort any column, or tick up to three to compare them side by side.
      </p>
      <LawmakersTable rows={rows} />
      <div className="mt-4 max-w-3xl space-y-1 text-[11px] text-gray-500">
        <p>
          <strong className="font-semibold text-gray-600">Bill counts show activity, not quality.</strong> Many bills are local (renaming a road, a new
          school) and many lawmakers co-author the same proposal.
        </p>
        <p>
          “Became law” counts 20th Congress bills that are now Republic Acts, including ones merged into a law the lawmaker co-authored. Earlier
          congresses’ outcomes aren’t in our sources yet. Totals combine Open Congress history (to about Sept 2025) with the live count.
        </p>
        <p>
          See{" "}
          <Link href="/laws" className="underline underline-offset-2">
            every law and its IRR deadline
          </Link>
          . Updated {formatDate(lawmakerData.generatedAt.slice(0, 10))} from {lawmakerData.billsScanned.toLocaleString()} bills.{" "}
          <Link href="/about" className="underline underline-offset-2">
            About the data
          </Link>
        </p>
      </div>
    </main>
  );
}
