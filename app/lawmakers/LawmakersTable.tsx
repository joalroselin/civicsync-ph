"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ZeroLawsNote } from "../components/ZeroLawsNote";

export interface Row {
  key: string;
  id: string | null;
  name: string;
  lastName: string;
  chamber: "senate" | "house";
  sub: string;
  portraitUrl: string | null;
  profileUrl: string | null;
  filed: number;
  laws: number;
  lawList: { number: string; ra: string | null; title: string }[];
  total: number;
  served: number;
  byCongress: Record<number, number | null>;
}

type SortKey = "name" | "filed" | "laws" | "total" | "served" | "past";
const PAST = [19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8];
const MAX_COMPARE = 3;
const ordinal = (n: number) => `${n}${n % 100 >= 11 && n % 100 <= 13 ? "th" : ["th", "st", "nd", "rd"][n % 10] ?? "th"}`;

/**
 * Every current member, sortable. Alphabetical by default: bill counts show
 * activity, not quality, so the table isn't presented as a ranking.
 */
export function LawmakersTable({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [chamber, setChamber] = useState<"all" | "senate" | "house">("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "name", dir: 1 });
  const [past, setPast] = useState(19);
  const [picked, setPicked] = useState<string[]>([]);
  // Row whose laws are listed underneath (one at a time).
  const [openLaws, setOpenLaws] = useState<string | null>(null);

  const shown = useMemo(() => {
    const f = q.trim().toLowerCase();
    const val = (r: Row): number | string => {
      switch (sort.key) {
        case "name":
          return `${r.lastName} ${r.name}`.toLowerCase();
        case "past":
          return r.byCongress[past] ?? -1;
        default:
          return r[sort.key];
      }
    };
    return rows
      .filter((r) => (chamber === "all" || r.chamber === chamber) && (!f || `${r.name} ${r.sub}`.toLowerCase().includes(f)))
      .sort((a, b) => {
        const x = val(a), y = val(b);
        const c = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
        return c * sort.dir || a.lastName.localeCompare(b.lastName);
      });
  }, [rows, q, chamber, sort, past]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "name" ? 1 : -1 }));
  const togglePick = (key: string) =>
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : p.length >= MAX_COMPARE ? p : [...p, key]));

  // Phones show one number column: the one being sorted by (or "This Congress").
  const phoneCol: SortKey = sort.key === "name" ? "filed" : sort.key;
  const cell = (k: SortKey) => (phoneCol === k ? "" : "hidden md:table-cell");

  const pill = (active: boolean) =>
    `rounded-full px-3 py-1 text-xs font-semibold ring-1 transition ${active ? "bg-navy text-white ring-navy" : "bg-surface text-gray-600 ring-gray-200 hover:ring-navy-ink/40"}`;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter by name, district or party-list"
          aria-label="Filter lawmakers"
          className="min-w-0 flex-1 rounded-xl bg-surface px-3 py-2 text-sm ring-1 ring-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-navy-ink sm:max-w-xs"
        />
        <div role="group" aria-label="Chamber" className="flex gap-1">
          {(["all", "senate", "house"] as const).map((c) => (
            <button key={c} type="button" aria-pressed={chamber === c} onClick={() => setChamber(c)} className={pill(chamber === c)}>
              {c === "all" ? "All" : c === "senate" ? "Senate" : "House"}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-gray-600 md:hidden">
          Sort by
          <select
            value={sort.key === "name" ? "name" : sort.key}
            onChange={(e) => {
              const k = e.target.value as SortKey;
              setSort({ key: k, dir: k === "name" ? 1 : -1 });
            }}
            className="rounded-md bg-surface py-1 text-xs font-semibold text-gray-800 ring-1 ring-gray-200"
          >
            <option value="name">Name</option>
            <option value="filed">This Congress</option>
            <option value="laws">Became law</option>
            <option value="total">Total on record</option>
            <option value="served">Congresses</option>
            <option value="past">{`${ordinal(past)} Congress`}</option>
          </select>
        </label>
        <span className="ml-auto text-xs text-gray-500">{shown.length} lawmakers · tick up to 3 to compare</span>
      </div>

      <div className="mt-3 overflow-x-auto rounded-2xl bg-surface ring-1 ring-gray-200/70">
        <table className="w-full text-sm md:min-w-[720px]">
          <thead className="border-b border-gray-100 bg-gray-50/80 text-left text-xs text-gray-600">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <span className="sr-only">Compare</span>
              </th>
              <SortHeader label="Lawmaker" k="name" sort={sort} onSort={toggleSort} className="sticky left-0 bg-gray-50" />
              <SortHeader label="This Congress" k="filed" sort={sort} onSort={toggleSort} numeric className={cell("filed")} />
              <SortHeader label="Became law" k="laws" sort={sort} onSort={toggleSort} numeric className={cell("laws")} />
              <SortHeader label="Total on record" k="total" sort={sort} onSort={toggleSort} numeric className={cell("total")} />
              <SortHeader label="Congresses" k="served" sort={sort} onSort={toggleSort} numeric className={cell("served")} />
              <th className={`px-3 py-2.5 text-right ${cell("past")}`} aria-sort={sort.key === "past" ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
                <span className="inline-flex items-center gap-1">
                  <label htmlFor="past-congress" className="sr-only">
                    Past congress column
                  </label>
                  <select
                    id="past-congress"
                    value={past}
                    onChange={(e) => {
                      setPast(Number(e.target.value));
                      setSort({ key: "past", dir: -1 });
                    }}
                    className="rounded-md bg-transparent py-0.5 text-xs font-semibold text-gray-700 ring-1 ring-gray-200"
                  >
                    {PAST.map((n) => (
                      <option key={n} value={n}>
                        {ordinal(n)} Congress
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => toggleSort("past")} className="font-semibold text-gray-700 hover:text-navy-ink" aria-label="Sort by this congress">
                    {sort.key === "past" ? (sort.dir === 1 ? "↑" : "↓") : "↕"}
                  </button>
                </span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {shown.map((r) => {
              const isPicked = picked.includes(r.key);
              const full = picked.length >= MAX_COMPARE && !isPicked;
              return [
                <tr key={r.key} className="group hover:bg-gray-50">
                  <td className="px-3 py-2.5">
                    <input
                      type="checkbox"
                      checked={isPicked}
                      disabled={full}
                      onChange={() => togglePick(r.key)}
                      aria-label={`Compare ${r.name}`}
                      title={full ? "You can compare up to 3" : `Compare ${r.name}`}
                      className="h-4 w-4 accent-[#1E3A8A] disabled:opacity-40"
                    />
                  </td>
                  <td className="sticky left-0 w-full max-w-0 bg-surface px-3 py-2.5 group-hover:bg-gray-50 md:w-auto md:max-w-none">
                    <div className="flex min-w-0 items-center gap-2.5 md:min-w-[200px]">
                      {r.portraitUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- small public-domain portraits
                        <img src={r.portraitUrl} alt="" width={32} height={32} loading="lazy" className="h-8 w-8 shrink-0 rounded-full object-cover object-top" />
                      ) : (
                        <span className="h-8 w-8 shrink-0 rounded-full bg-navy-ink/10" aria-hidden />
                      )}
                      <div className="min-w-0">
                        {r.id ? (
                          <Link href={`/people/${r.id}`} className="block truncate font-semibold text-gray-900 hover:text-navy-ink">
                            {r.name}
                          </Link>
                        ) : (
                          <span className="block truncate font-semibold text-gray-900">{r.name}</span>
                        )}
                        <span className="block truncate text-xs text-gray-500">
                          {r.chamber === "senate" ? "Senator" : "Rep."} · {r.sub}
                        </span>
                      </div>
                    </div>
                  </td>
                  <Num value={r.filed} className={cell("filed")} />
                  {(
                    <td className={`px-3 py-2.5 text-right ${cell("laws")}`}>
                      <button
                        type="button"
                        onClick={() => setOpenLaws((o) => (o === r.key ? null : r.key))}
                        aria-expanded={openLaws === r.key}
                        aria-controls={`laws-${r.key}`}
                        title={r.laws ? "Show which laws" : "Why zero?"}
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 tabular-nums underline decoration-dotted underline-offset-4 ${
                          r.laws ? "font-semibold text-emerald-700 hover:bg-emerald-50" : "text-gray-800 decoration-gray-400 hover:bg-gray-100"
                        }`}
                      >
                        {r.laws}
                        <span aria-hidden className="text-[10px]">{openLaws === r.key ? "▲" : "▼"}</span>
                      </button>
                    </td>
                  )}
                  <Num value={r.total} className={cell("total")} />
                  <Num value={r.served} className={cell("served")} />
                  <Num value={r.byCongress[past] ?? null} className={cell("past")} />
                </tr>,
                openLaws === r.key && (
                  <tr key={`${r.key}-laws`} id={`laws-${r.key}`} className={r.laws ? "bg-emerald-50/40" : "bg-gray-50"}>
                    <td />
                    <td colSpan={6} className="px-3 pb-3 pt-1">
                      {/* w-0 min-w-full: take the table's width, never widen it (long titles truncate). */}
                      <div className="w-0 min-w-full">
                      {r.laws === 0 ? (
                        <ZeroLawsNote chamber={r.chamber} compact />
                      ) : (
                        <>
                      <p className="mb-1.5 truncate text-xs font-semibold text-gray-700">
                        Became law this Congress ({r.laws}), including laws they co-authored
                      </p>
                      <ul className="flex flex-col gap-1.5">
                        {r.lawList.map((l) => (
                          <li key={l.number} className="text-[13px]">
                            <Link href={`/bills/${l.number}`} className="group/law flex gap-2 hover:text-navy-ink">
                              <span className="shrink-0 font-semibold text-emerald-700">{l.ra ? `RA ${l.ra}` : "Law"}</span>
                              <span className="min-w-0 truncate text-gray-800 group-hover/law:underline">{l.title}</span>
                              <span className="shrink-0 text-xs text-gray-500">{l.number.replace(/^SBN-/, "SB ").replace(/^HB0*/, "HB ")}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                        </>
                      )}
                      </div>
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
      </div>

      {picked.length > 0 && (
        <div className="fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-30 px-4 md:bottom-6 md:left-auto md:right-6 md:px-0">
          <div className="mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-slate-900 p-3 pl-4 text-white shadow-lg ring-1 ring-white/10">
            <p className="flex-1 text-sm">
              <span className="font-semibold">{picked.length} selected</span>
              <span className="block text-xs text-slate-300">{picked.length < 2 ? "Pick at least 2 to compare" : `Up to ${MAX_COMPARE}`}</span>
            </p>
            <button type="button" onClick={() => setPicked([])} className="rounded-lg px-3 py-2 text-sm text-slate-300 hover:text-white">
              Clear
            </button>
            <button
              type="button"
              disabled={picked.length < 2}
              onClick={() => router.push(`/compare?ids=${picked.join(",")}`)}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-navy disabled:opacity-50"
            >
              Compare →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortHeader({
  label,
  k,
  sort,
  onSort,
  numeric,
  className = "",
}: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  numeric?: boolean;
  className?: string;
}) {
  const active = sort.key === k;
  return (
    <th className={`px-3 py-2.5 ${numeric ? "text-right" : ""} ${className}`} aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}>
      <button type="button" onClick={() => onSort(k)} className={`inline-flex items-center gap-1 font-semibold hover:text-navy-ink ${active ? "text-navy-ink" : "text-gray-700"}`}>
        {label}
        <span aria-hidden>{active ? (sort.dir === 1 ? "↑" : "↓") : "↕"}</span>
      </button>
    </th>
  );
}

function Num({ value, accent, className = "" }: { value: number | null; accent?: boolean; className?: string }) {
  return <td className={`px-3 py-2.5 text-right tabular-nums ${accent ? "font-semibold text-emerald-700" : "text-gray-800"} ${className}`}>{value == null ? "–" : value.toLocaleString()}</td>;
}
