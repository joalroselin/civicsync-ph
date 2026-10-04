import Link from "next/link";
import type { OpenCongressPerson } from "@/lib/openCongress";
import { getLawmakerRecord } from "@/lib/people";
import { ordinal } from "@/lib/format";
import { ZeroLawsNote } from "../../components/ZeroLawsNote";

type Served = NonNullable<OpenCongressPerson["congresses_served"]>;

/**
 * Headline numbers plus the service record with bills per congress. Streams
 * in after the profile (wrap in <Suspense fallback={<RecordFallback/>}>).
 */
export async function LawmakerRecord({ person }: { person: OpenCongressPerson }) {
  const served = person.congresses_served ?? [];
  const record = await getLawmakerRecord(person);
  const max = Math.max(1, ...record.byCongress.map((c) => c.bills ?? 0));
  const laws = record.current?.becameLaw ?? [];

  return (
    <>
      <dl className="mt-3 grid grid-cols-3 gap-2">
        <Stat value={record.totalOnRecord} label="bills on record" hint="Every congress served, including this one" />
        {record.current ? (
          <>
            <Stat value={record.current.filed} label="this Congress" hint="20th Congress so far, from the live tracker" />
            <Stat value={laws.length} label="became law" hint="20th Congress so far, as author or co-author" accent={laws.length > 0} />
          </>
        ) : (
          <Stat value={new Set(served.map((c) => c.congress_number)).size} label="congresses" hint="Congresses served" />
        )}
      </dl>

      {record.current && laws.length === 0 && (
        <div className="mt-2 rounded-2xl bg-surface px-4 py-3 ring-1 ring-gray-200/70">
          <ZeroLawsNote chamber={/senat/i.test(served[0]?.position ?? "") ? "senate" : "house"} compact />
        </div>
      )}

      {laws.length > 0 && (
        <details className="mt-2 rounded-2xl bg-surface px-4 py-3 text-sm ring-1 ring-gray-200/70">
          <summary className="cursor-pointer font-semibold text-gray-700">
            {laws.length === 1 ? "1 bill" : `${laws.length} bills`} became law this Congress
          </summary>
          <ul className="mt-2 divide-y divide-gray-100">
            {laws.map((b) => (
              <li key={b.routeId} className="py-2">
                <Link href={`/bills/${b.routeId}`} className="block hover:text-navy-ink">
                  <span className="text-xs font-semibold text-navy-ink">{b.label}</span>
                  <span className="ml-2 text-xs text-emerald-700">{lawNumber(b.status)}</span>
                  <span className="mt-0.5 line-clamp-2 block text-[13px] leading-snug">{b.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[11px] text-gray-500">Includes bills merged into a law they co-authored. Earlier congresses: outcomes aren’t in our sources yet.</p>
        </details>
      )}

      {served.length > 0 && (
        <>
          {/* Collapsed on phones to save space; always open in the desktop column. */}
          <details className="mt-3 rounded-2xl bg-surface p-4 text-sm ring-1 ring-gray-200/70 lg:hidden">
            <summary className="cursor-pointer font-semibold text-gray-700">Service record · bills per congress</summary>
            <ServiceRows served={served} counts={record.byCongress} max={max} />
          </details>
          <section className="mt-3 hidden rounded-2xl bg-surface p-4 text-sm ring-1 ring-gray-200/70 lg:block">
            <h3 className="font-semibold text-gray-700">Service record · bills per congress</h3>
            <ServiceRows served={served} counts={record.byCongress} max={max} />
          </section>
        </>
      )}
    </>
  );
}

/** "REPUBLIC ACT RA12324 (Lapsed …)" → "RA 12324" */
function lawNumber(status?: string | null) {
  const m = status?.match(/RA\s?(\d{4,6})/i);
  return m ? `RA ${m[1]}` : "Became law";
}

function Stat({ value, label, hint, accent }: { value: number | null; label: string; hint: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl bg-surface px-2 py-3 text-center ring-1 ring-gray-200/70" title={hint}>
      <dt className="sr-only">{`${label} (${hint})`}</dt>
      <dd>
        <span className={`block font-display text-xl font-semibold ${accent ? "text-emerald-700" : "text-navy-ink"}`}>{value == null ? "–" : value.toLocaleString()}</span>
        <span className="mt-0.5 block text-[11px] leading-tight text-gray-500">{label}</span>
      </dd>
    </div>
  );
}

function ServiceRows({ served, counts, max }: { served: Served; counts: { congress: number; bills: number | null }[]; max: number }) {
  const byCongress = new Map(counts.map((c) => [c.congress, c.bills]));
  // One row per congress (someone can hold two posts in one congress).
  const rows = [...new Map(served.map((c) => [c.congress_number, c])).values()];
  return (
    <ul className="mt-3 flex flex-col gap-2.5">
      {rows.map((c) => {
        const n = byCongress.get(c.congress_number);
        return (
          <li key={c.congress_number}>
            <div className="flex items-baseline justify-between gap-2">
              <span>
                {ordinal(c.congress_number)} <span className="text-gray-500">· {c.position}</span>
              </span>
              <span className="shrink-0 tabular-nums text-gray-700">{n == null ? "–" : `${n.toLocaleString()} bills`}</span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-gray-100" aria-hidden>
              <div className="h-full rounded-full bg-navy-ink/60" style={{ width: `${n ? Math.max(2, (n / max) * 100) : 0}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function RecordFallback() {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2" aria-busy="true" aria-label="Loading record">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-[68px] animate-pulse rounded-2xl bg-surface ring-1 ring-gray-200/70" />
      ))}
    </div>
  );
}
