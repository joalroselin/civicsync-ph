import Link from "next/link";
import { explainStatus, STAGES } from "@/lib/billStages";

/** "What does this mean?" under a bill's status: one sentence plus where it sits on the path to law. */
export function StatusHelp({ status }: { status: string | null }) {
  const help = explainStatus(status);
  if (!help) return null;
  return (
    <details className="group mt-3 print:hidden rounded-xl bg-gray-50 px-3 py-2 text-sm open:pb-3">
      <summary className="cursor-pointer list-none font-semibold text-navy-ink marker:hidden">
        <span className="inline-flex items-center gap-1">
          What does this mean?
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="transition group-open:rotate-180" aria-hidden>
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </summary>
      <p className="mt-2 leading-relaxed text-gray-700">{help.meaning}</p>
      {help.stage !== null && (
        <ol className="mt-3 grid grid-cols-8 gap-1" aria-label="Path to becoming law">
          {STAGES.map((s, i) => {
            const state = i < help.stage! ? "done" : i === help.stage ? "now" : "next";
            return (
              <li key={s.short} className="min-w-0" aria-current={state === "now" ? "step" : undefined}>
                <span
                  className={`block h-1.5 rounded-full ${state === "done" ? "bg-navy-ink/60" : state === "now" ? "bg-crimson" : "bg-gray-200"}`}
                  aria-hidden
                />
                <span className={`mt-1 block truncate text-[10px] ${state === "now" ? "font-semibold text-crimson-ink" : "text-gray-500"}`} title={s.title}>
                  {s.short}
                </span>
              </li>
            );
          })}
        </ol>
      )}
      <Link href="/how-bills-become-law" className="mt-3 inline-block text-xs font-semibold text-navy-ink underline underline-offset-2">
        How a bill becomes law →
      </Link>
    </details>
  );
}
