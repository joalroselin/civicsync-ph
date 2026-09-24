/**
 * Shown wherever BatasWatch — our only source for 20th Congress bills filed
 * after Open Congress's cut-off — can't be reached. Accepted v1 risk: the
 * rest of the app keeps working from Open Congress.
 */
export function LiveDataUnavailable({ what = "Live bill data" }: { what?: string }) {
  return (
    <div role="status" className="flex gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200">
      <svg className="mt-0.5 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <p>
        <span className="font-semibold">{what} is temporarily unavailable.</span>{" "}
        Our live tracker for the 20th Congress isn’t responding. Older records still work — try again in a few minutes.
      </p>
    </div>
  );
}
