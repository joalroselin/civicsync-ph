import Link from "next/link";
import { getMemberById } from "@/lib/lawmakers";
import { toTitleCase } from "@/lib/format";

/** Frequent co-authors and where their bills go (20th Congress, from the nightly data). */
export function WorksWith({ id }: { id: string }) {
  const m = getMemberById(id);
  if (!m || (!m.coAuthors?.length && !m.committees?.length)) return null;
  return (
    <section className="mt-3 rounded-2xl bg-surface p-4 text-sm ring-1 ring-gray-200/70">
      {m.coAuthors && m.coAuthors.length > 0 && (
        <>
          <h3 className="font-semibold text-gray-700">Often files bills with</h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {m.coAuthors.map((c) => (
              <li key={c.name} className="flex items-baseline justify-between gap-2">
                {c.id ? (
                  <Link href={`/people/${c.id}`} className="truncate text-navy-ink hover:underline">
                    {c.name}
                  </Link>
                ) : (
                  <span className="truncate">{c.name}</span>
                )}
                <span className="shrink-0 text-xs tabular-nums text-gray-500">{c.count} bills</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {m.committees && m.committees.length > 0 && (
        <>
          <h3 className={`font-semibold text-gray-700 ${m.coAuthors?.length ? "mt-4" : ""}`}>Their bills usually go to</h3>
          <ul className="mt-2 flex flex-col gap-1.5">
            {m.committees.map((c) => (
              <li key={c.name} className="flex items-baseline justify-between gap-2">
                <span className="truncate">{toTitleCase(c.name)} committee</span>
                <span className="shrink-0 text-xs tabular-nums text-gray-500">{c.count} bills</span>
              </li>
            ))}
          </ul>
        </>
      )}
      <p className="mt-3 text-[11px] text-gray-500">20th Congress. Co-authors from bills with up to 10 authors.</p>
    </section>
  );
}
