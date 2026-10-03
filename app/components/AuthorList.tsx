"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { personName, type OpenCongressPerson } from "@/lib/openCongress";
import { PersonCard } from "./PersonCard";
import { SearchLink } from "./SearchNavigation";

const VISIBLE = 5;

/** "Andrew Julian K. Romualdez" → "Andrew Romualdez"; keeps suffixes like Jr. and III. */
export function shortName(full: string) {
  const parts = full.replace(/"[^"]*"/g, "").replace(/^(Atty|Dr|Engr|Hon)\.\s+/i, "").trim().split(/\s+/);
  const suffix = parts.filter((p) => /^(Jr\.?|Sr\.?|II|III|IV)$/.test(p));
  const core = parts.filter((p) => !suffix.includes(p) && !/^[A-Z]\.$/.test(p));
  if (core.length <= 2) return [...core, ...suffix].join(" ");
  // Surnames can be two words ("De Lima", "Dela Cruz").
  const twoWordSurname = /^(De|Del|Dela|Delos|San|Sta\.?|Santa)$/i.test(core[core.length - 2]);
  const surname = core.slice(twoWordSurname ? -2 : -1);
  return [core[0], ...surname, ...suffix].join(" ");
}
const FILTER_FROM = 20;

/**
 * A bill's authors, in the order on record (first is usually the original
 * filer). Shows the first few in full; the rest open as a compact list,
 * with a filter when there are many (some House bills have 60+ authors).
 */
export function AuthorList({ people, names, ids = [], role }: { people: OpenCongressPerson[]; names: string[]; ids?: (string | null)[]; role: string }) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const usePeople = people.length > 0;
  const total = usePeople ? people.length : names.length;

  const rest = useMemo(() => {
    const items = usePeople
      ? people.map((p) => ({ key: p.id, name: personName(p), href: `/people/${p.id}` as string | null }))
      : names.map((n, i) => ({ key: `${n}-${i}`, name: n, href: ids[i] ? `/people/${ids[i]}` : null }));
    const f = filter.trim().toLowerCase();
    // Filtering searches everyone; otherwise list those not shown above.
    return f ? items.filter((i) => i.name.toLowerCase().includes(f)) : items.slice(VISIBLE);
  }, [people, names, ids, usePeople, filter]);

  if (total === 0) return <p className="text-sm text-gray-500">No authors on record yet.</p>;

  return (
    <div>
      {usePeople ? (
        <ul className="-mx-1 flex flex-col gap-2">
          {people.slice(0, VISIBLE).map((a) => (
            <li key={a.id}>
              <PersonCard person={a} role={role} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="divide-y divide-gray-100">
          {names.slice(0, VISIBLE).map((name, i) => {
            const inner = (
              <>
                {/* The card heading already says the role ("67 Representatives"). */}
                <span className="truncate" title={`${role} ${name}`}>
                  {name}
                </span>
                <span className="shrink-0 text-xs text-navy-ink">Receipts →</span>
              </>
            );
            const cls = "flex items-center justify-between py-2.5 text-sm font-medium";
            return (
              <li key={`${name}-${i}`}>
                {ids[i] ? (
                  <Link href={`/people/${ids[i]}`} className={cls}>
                    {inner}
                  </Link>
                ) : (
                  // Unknown to Open Congress: search the full name, never just the surname
                  // (a surname search sent "Brian Poe" to Grace Poe).
                  <SearchLink q={name.replace(/"[^"]*"/g, "").replace(/\s+/g, " ").trim()} className={cls}>
                    {inner}
                  </SearchLink>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {total > VISIBLE && (
        <div className="mt-3 border-t border-gray-100 pt-3">
          {open && (
            <div className="mb-3">
              {total > FILTER_FROM && (
                <input
                  type="search"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Find an author"
                  aria-label="Find an author"
                  className="mb-3 w-full rounded-xl bg-gray-50 px-3 py-2 text-sm ring-1 ring-gray-200 focus:outline-none focus:ring-navy-ink/40"
                />
              )}
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
                {rest.map((i) => (
                  <li key={i.key} className="truncate" title={i.name}>
                    {i.href ? (
                      <Link href={i.href} className="text-gray-700 hover:text-navy-ink hover:underline">
                        {shortName(i.name)}
                      </Link>
                    ) : (
                      <SearchLink q={i.name.replace(/"[^"]*"/g, "").replace(/\s+/g, " ").trim()} className="text-gray-700 hover:text-navy-ink hover:underline">
                        {shortName(i.name)}
                      </SearchLink>
                    )}
                  </li>
                ))}
                {rest.length === 0 && <li className="text-gray-500">No author matches “{filter}”.</li>}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen((o) => !o);
              setFilter("");
            }}
            aria-expanded={open}
            className="text-sm font-semibold text-navy-ink hover:text-crimson-ink"
          >
            {open ? "Show fewer" : `Show all ${total} authors`}
          </button>
        </div>
      )}
    </div>
  );
}
