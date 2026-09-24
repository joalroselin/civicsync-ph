import Link from "next/link";
import { personInitials, personName, personShortName, type OpenCongressPerson } from "@/lib/openCongress";

export function PersonCard({ person }: { person: OpenCongressPerson }) {
  return (
    <Link
      href={`/people/${person.id}`}
      className="flex items-center gap-3 rounded-2xl bg-white p-3.5 shadow-sm ring-1 ring-gray-200/70 transition hover:ring-navy/30"
    >
      <Avatar person={person} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-gray-900">{personShortName(person)}</p>
        <p className="truncate text-xs text-gray-500">{personName(person)}</p>
      </div>
      <span className="shrink-0 text-xs font-semibold text-navy">Receipts →</span>
    </Link>
  );
}

export function Avatar({ person, size = 44 }: { person: OpenCongressPerson; size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-navy/10 font-display font-semibold text-navy"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden
    >
      {personInitials(person)}
    </span>
  );
}
