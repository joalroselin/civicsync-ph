import { billHistory, trackingSince } from "@/lib/statusHistory";
import { formatDate, displayStatus } from "@/lib/format";


/** Changes we've recorded for this bill (daily snapshots, CS-119/CS-303). */
export function StatusTimeline({ number, congress }: { number: string; congress: number }) {
  if (congress !== 20) return null;
  const history = billHistory(number);
  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <p className="text-xs font-semibold text-gray-600">Status history</p>
      {history.length ? (
        <ol className="mt-2 space-y-2 border-l-2 border-gray-200 pl-3">
          {history.map((c) => (
            <li key={`${c.date}-${c.to}`} className="relative text-xs">
              <span className="absolute -left-[17px] top-1 h-2 w-2 rounded-full bg-navy-ink" aria-hidden />
              <span className="font-semibold text-gray-800">{formatDate(c.date)}</span>
              <span className="block text-gray-700">{displayStatus(c.to)}</span>
              <span className="block text-gray-500">was: {displayStatus(c.from)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="mt-1 text-xs text-gray-500">No changes since we started checking daily on {formatDate(trackingSince)}.</p>
      )}
    </div>
  );
}
