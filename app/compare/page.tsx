import type { Metadata } from "next";
import Link from "next/link";
import { getMembers, memberKey, type Member } from "@/lib/lawmakers";
import { PageHeader } from "../components/PageHeader";
import { seatLabel, toTitleCase } from "@/lib/format";

export const metadata: Metadata = { title: "Compare lawmakers", robots: { index: false } };

const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

/** Up to 3 lawmakers side by side (CS-304). Facts only, no "winner". */
export default async function ComparePage(props: { searchParams: Promise<{ ids?: string }> }) {
  const { ids = "" } = await props.searchParams;
  const keys = ids.split(",").filter(Boolean).slice(0, 3);
  const members = getMembers(keys);

  if (members.length === 0)
    return (
      <main className="px-5 pb-5 md:pt-4">
        <PageHeader title="Compare" back="/lawmakers" />
        <p className="text-sm text-gray-600">
          Pick two or three lawmakers from the{" "}
          <Link href="/lawmakers" className="font-semibold text-navy-ink underline underline-offset-2">
            lawmakers table
          </Link>{" "}
          to compare them.
        </p>
      </main>
    );

  const congresses = [...new Set(members.flatMap((m) => m.congresses.map((c) => c.congress)))].sort((a, b) => b - a);
  const maxBills = Math.max(1, ...members.flatMap((m) => m.congresses.map((c) => c.bills ?? 0)));
  const without = (k: string) => `/compare?ids=${keys.filter((x) => x !== k).join(",")}`;
  const cols = members.length === 1 ? "grid-cols-1" : members.length === 2 ? "grid-cols-2" : "grid-cols-3";

  return (
    <main className="px-5 pb-12 md:pt-4">
      <PageHeader title="Compare" back="/lawmakers" />
      <div className="max-w-5xl">
        {/* One column per lawmaker; rows line up across columns. */}
        <div className={`grid ${cols} gap-3`}>
          {members.map((m) => (
            <section key={memberKey(m)} className="relative rounded-2xl bg-surface p-4 text-center ring-1 ring-gray-200/70">
              {members.length > 1 && (
                <Link href={without(memberKey(m))} aria-label={`Remove ${m.name}`} className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-full text-gray-500 hover:bg-gray-100">
                  ×
                </Link>
              )}
              {m.portraitUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- public-domain portrait
                <img src={m.portraitUrl} alt="" width={72} height={72} className="mx-auto h-16 w-16 rounded-full object-cover object-top md:h-20 md:w-20" />
              ) : (
                <span className="mx-auto block h-16 w-16 rounded-full bg-navy-ink/10" aria-hidden />
              )}
              <h2 className="mt-2 font-display text-base font-semibold leading-tight md:text-lg">
                {m.id ? (
                  <Link href={`/people/${m.id}`} className="hover:text-navy-ink">
                    {m.name}
                  </Link>
                ) : (
                  m.name
                )}
              </h2>
              <p className="mt-0.5 text-xs text-gray-500">{m.chamber === "senate" ? m.position : `Rep. · ${seatLabel(m.representation) ?? "House"}`}</p>
            </section>
          ))}
        </div>

        <Block title="This Congress and overall">
          <StatRow label="Bills filed this Congress" members={members} value={(m) => m.filedThisCongress} cols={cols} />
          <StatRow label="Became law this Congress" members={members} value={(m) => m.becameLaw} cols={cols} />
          <StatRow label="Bills on record, all congresses" members={members} value={(m) => m.totalOnRecord} cols={cols} />
          <StatRow label="Congresses served" members={members} value={(m) => m.congressesServed} cols={cols} />
        </Block>

        <Block title="Bills per congress">
          {congresses.map((c) => (
            <div key={c} className={`grid ${cols} gap-3 py-1.5`}>
              {members.map((m) => {
                const n = m.congresses.find((x) => x.congress === c)?.bills;
                return (
                  <div key={memberKey(m)} className="text-xs">
                    <div className="flex justify-between gap-2 text-gray-600">
                      <span>{ordinal(c)}</span>
                      <span className="tabular-nums text-gray-800">{n == null ? "–" : n.toLocaleString()}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100" aria-hidden>
                      {n ? <div className="h-full rounded-full bg-navy-ink/60" style={{ width: `${Math.max(2, (n / maxBills) * 100)}%` }} /> : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </Block>

        <Block title="Main topics this Congress">
          <div className={`grid ${cols} gap-3`}>
            {members.map((m) => (
              <ul key={memberKey(m)} className="flex flex-wrap content-start gap-1.5">
                {m.topTopics.length ? (
                  m.topTopics.map((t) => (
                    <li key={t.label} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-700">
                      {t.label} <span className="font-semibold text-gray-800">{t.count}</span>
                    </li>
                  ))
                ) : (
                  <li className="text-xs text-gray-500">–</li>
                )}
              </ul>
            ))}
          </div>
        </Block>

        <Block title="Became law this Congress">
          <div className={`grid ${cols} gap-3`}>
            {members.map((m) => (
              <ul key={memberKey(m)} className="flex flex-col gap-2 text-xs">
                {m.laws.length ? (
                  m.laws.map((l) => (
                    <li key={l.number}>
                      <Link href={`/bills/${l.number}`} className="hover:text-navy-ink">
                        <span className="font-semibold text-emerald-700">{l.ra ? `RA ${l.ra}` : "Law"}</span>{" "}
                        <span className="line-clamp-2 text-gray-700">{toTitleCase(l.title)}</span>
                      </Link>
                    </li>
                  ))
                ) : (
                  <li className="text-gray-500">None yet</li>
                )}
              </ul>
            ))}
          </div>
        </Block>

        <p className="mt-6 text-[11px] text-gray-500">
          Bill counts show activity, not quality. “Became law” covers the 20th Congress so far, including bills merged into a law they co-authored.{" "}
          <Link href="/lawmakers" className="underline underline-offset-2">
            Change who you’re comparing
          </Link>
        </p>
      </div>
    </main>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-4 rounded-2xl bg-surface p-4 ring-1 ring-gray-200/70">
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h3>
      {children}
    </section>
  );
}

function StatRow({ label, members, value, cols }: { label: string; members: Member[]; value: (m: Member) => number; cols: string }) {
  return (
    <div className="border-t border-gray-100 py-2.5 first:border-0 first:pt-0">
      <p className="mb-1 text-xs text-gray-500">{label}</p>
      <div className={`grid ${cols} gap-3`}>
        {members.map((m) => (
          <p key={memberKey(m)} className="font-display text-xl font-semibold tabular-nums text-navy-ink">
            {value(m).toLocaleString()}
          </p>
        ))}
      </div>
    </div>
  );
}
