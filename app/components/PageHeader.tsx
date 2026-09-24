import Link from "next/link";

export function PageHeader({ title, back, children }: { title: string; back?: string; children?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-10 -mx-5 mb-4 flex items-center gap-2 bg-paper/90 px-5 py-3 backdrop-blur">
      {back && (
        <Link href={back} aria-label="Back" className="-ml-2 grid h-9 w-9 place-items-center rounded-full text-gray-700 hover:bg-gray-200/60">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      )}
      <h1 className="flex-1 truncate font-display text-xl font-semibold">{title}</h1>
      {children}
    </header>
  );
}

export function Pager({ basePath, params, page, hasMore }: { basePath: string; params: Record<string, string | undefined>; page: number; hasMore: boolean }) {
  if (page <= 1 && !hasMore) return null;
  const href = (p: number) => {
    const qs = new URLSearchParams(Object.entries({ ...params, page: p > 1 ? String(p) : undefined }).filter(([, v]) => v) as [string, string][]);
    const s = qs.toString();
    return s ? `${basePath}?${s}` : basePath;
  };
  const cls = "rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 ring-gray-200 bg-white";
  return (
    <nav className="mt-4 flex items-center justify-between" aria-label="Pagination">
      {page > 1 ? <Link className={cls} href={href(page - 1)}>← Previous</Link> : <span />}
      <span className="text-xs text-gray-500">Page {page}</span>
      {hasMore ? <Link className={cls} href={href(page + 1)}>Next →</Link> : <span />}
    </nav>
  );
}
