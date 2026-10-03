import Link from "next/link";
import { personInitials, personName, personShortName, type OpenCongressPerson } from "@/lib/openCongress";

/** `role` (e.g. "Senator") is shown when the card appears under a bill's authors. */
export function PersonCard({ person, role }: { person: OpenCongressPerson; role?: string }) {
  return (
    <Link
      href={`/people/${person.id}`}
      className="flex items-center gap-3 rounded-2xl bg-surface p-3.5 shadow-sm ring-1 ring-gray-200/70 transition hover:ring-navy-ink/30"
    >
      <Avatar person={person} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{personShortName(person)}</p>
        <p className="truncate text-xs text-gray-500">
          {role && <span className="mr-1.5 rounded bg-navy-ink/10 px-1.5 py-0.5 font-semibold text-navy-ink">{role}</span>}
          {personName(person)}
        </p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-navy-ink">Receipts →</span>
    </Link>
  );
}

export function Avatar({ person, size = 44 }: { person: OpenCongressPerson; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-navy-ink/10 font-display font-semibold text-navy-ink"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {personInitials(person)}
    </span>
  );
}
