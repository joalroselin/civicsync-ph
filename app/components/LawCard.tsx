import type { BillLaw } from "@/lib/bills";
import { formatDate } from "@/lib/format";

/**
 * Shown on bills that became law (CS-305): RA number, how and when, and the
 * signed text. Implementing rules (IRR) aren't in our sources yet (CS-129),
 * so we ask for them instead of guessing.
 */
export function LawCard({ law, email, billLabel }: { law: BillLaw; email: string; billLabel: string }) {
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
      <p className="mt-3 border-t border-emerald-200 pt-3 text-xs leading-relaxed text-emerald-900">
        <strong className="font-semibold">Implementing rules (IRR):</strong> agencies write the detailed rules that put a law into effect. We don’t track
        these yet.{" "}
        <a href={irrMail} className="font-semibold underline underline-offset-2">
          Know where this law’s IRR is? Send us the link
        </a>
        .
      </p>
    </section>
  );
}
