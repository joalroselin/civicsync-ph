import Link from "next/link";
import type { BillLaw } from "@/lib/bills";
import { formatDate } from "@/lib/format";
import { irrStatus, type LawRecord } from "@/lib/laws";
import { IrrStatusBadge } from "./IrrStatus";

/**
 * Shown on bills that became law (CS-305): RA number, how and when, and the
 * signed text. Implementing rules (IRR) aren't in our sources yet (CS-129),
 * so we ask for them instead of guessing.
 */
export function LawCard({ law, email, billLabel, record }: { law: BillLaw; email: string; billLabel: string; record: LawRecord | null }) {
  const status = record ? irrStatus(record) : null;
  const irrMail = `mailto:${email}?subject=${encodeURIComponent(`IRR for RA ${law.ra} (${billLabel}): CivicSync PH`)}&body=${encodeURIComponent(
    `Link to the Implementing Rules and Regulations (IRR) for Republic Act No. ${law.ra}:\n\nIssuing agency (if you know it):\n`
  )}`;
  return (
    <section className="mt-4 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200" aria-labelledby="law-heading">
      <p className="text-xs font-semibold uppercase tracking-wider text-emerald-800">Now law</p>
      <h3 id="law-heading" className="mt-0.5 font-display text-lg font-semibold text-emerald-900">
        Republic Act No. {law.ra}
      </h3>
      <p className="mt-1 text-sm text-emerald-900">
        {law.how === "lapsed"
          ? `Became law without the President’s signature${law.date ? ` on ${formatDate(law.date)}` : ""} (it “lapsed into law” after 30 days).`
          : `Signed into law${law.date ? ` on ${formatDate(law.date)}` : ""}.`}{" "}
        Laws usually take effect 15 days after they’re published.
      </p>
      {!law.textUrl && (
        <a
          href={`https://www.officialgazette.gov.ph/?s=${encodeURIComponent(`Republic Act No. ${law.ra}`)}`}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:ring-emerald-600"
        >
          Find it in the Official Gazette <span aria-hidden>↗</span>
        </a>
      )}
      {law.textUrl && (
        <a
          href={law.textUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-surface px-3 py-2 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200 hover:ring-emerald-600"
        >
          Read the signed law (PDF) <span aria-hidden>↗</span>
        </a>
      )}
      <div className="mt-3 border-t border-emerald-200 pt-3 text-xs leading-relaxed text-emerald-900">
        <p className="flex flex-wrap items-center gap-2">
          <strong className="font-semibold">Implementing rules (IRR)</strong>
          {status && <IrrStatusBadge state={status.state} />}
        </p>
        {record?.irr && status ? (
          <>
            <p className="mt-1.5">
              {record.irr.agency ? <>Who writes them: <strong className="font-semibold">{record.irr.agency}</strong>. </> : null}
              {record.irr.amount && record.irr.unit
                ? `Deadline: within ${record.irr.amount} ${record.irr.unit} of the law ${record.irr.from === "approval" ? "being approved" : "taking effect"}`
                : "The law asks for an IRR but doesn’t set a deadline"}
              {status.due ? `, so around ${formatDate(status.due)} (our estimate, since we don’t track publication dates).` : "."}
            </p>
            <details className="mt-1.5">
              <summary className="cursor-pointer font-semibold">What the law says</summary>
              <blockquote className="mt-1 border-l-2 border-emerald-300 pl-2 italic text-emerald-900/90">“{record.irr.clause}”</blockquote>
              <p className="mt-1 text-[11px] text-emerald-900/80">Read automatically from the scanned law, so check the signed text for exact wording.</p>
            </details>
          </>
        ) : record?.read === "ok" ? (
          <p className="mt-1.5">This law doesn’t call for an IRR. Some laws, like budgets or renamings, take effect without one.</p>
        ) : (
          <p className="mt-1.5">Agencies write the detailed rules that put a law into effect. We’re reading this law’s text to find who must write them and by when.</p>
        )}
        <p className="mt-2">
          Has the IRR come out?{" "}
          <a href={irrMail} className="font-semibold underline underline-offset-2">
            Send us the link
          </a>{" "}
          ·{" "}
          <Link href="/laws" className="font-semibold underline underline-offset-2">
            All laws and IRR deadlines
          </Link>
        </p>
      </div>
    </section>
  );
}
